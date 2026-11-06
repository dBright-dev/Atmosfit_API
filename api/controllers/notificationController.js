const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Controller managing device push tokens and real-time alert dispatch
 * via Firebase Cloud Messaging (FCM).
 */

async function registerDevice(userId, token, platform = 'android') {
  if (!token) {
    throw new Error('Device token is required');
  }

  const db = getFirestore();
  const tokenDocRef = db.collection('device_tokens').doc(token);

  await tokenDocRef.set(
    {
      userId: userId || 'anonymous',
      token,
      platform,
      updatedAt: new Date().toISOString(),
      active: true,
    },
    { merge: true }
  );

  return { registered: true, token };
}

async function unregisterDevice(token) {
  if (!token) {
    throw new Error('Device token is required');
  }

  const db = getFirestore();
  await db.collection('device_tokens').doc(token).delete();
  return { unregistered: true };
}

async function sendTestNotification(token, title, body, data = {}) {
  const messaging = getMessaging();

  const message = {
    notification: {
      title: title || 'AtmosFit Live Alert',
      body: body || 'Real-time FCM push notification delivery confirmed!',
    },
    data: {
      screen: data.screen || 'home',
      timestamp: String(Date.now()),
      ...data,
    },
  };

  if (token) {
    message.token = token;
  } else {
    message.topic = 'weather_alerts';
  }

  const response = await messaging.send(message);
  return { success: true, messageId: response };
}

async function resolveTokens(db, userId) {
  const snapshot = await db
    .collection('device_tokens')
    .where('userId', '==', userId)
    .where('active', '==', true)
    .get();

  const tokens = new Set();
  snapshot.forEach((doc) => tokens.add(doc.id));

  // The Android client also mirrors its token onto users/{uid}. Fall back to
  // that copy when /notifications/devices was never reached (for example when
  // the app registered before this endpoint was deployed), otherwise the push
  // silently has no recipient.
  if (tokens.size === 0) {
    const userDoc = await db.collection('users').doc(userId).get();
    const mirrored = userDoc.exists ? userDoc.get('fcmToken') : null;
    if (mirrored) {
      tokens.add(mirrored);
    }
  }
  return [...tokens];
}

async function sendPushToUser(userId, payload) {
  const db = getFirestore();
  const messaging = getMessaging();

  const tokens = await resolveTokens(db, userId);
  if (tokens.length === 0) {
    return { sentCount: 0, reason: 'No active device tokens found for user' };
  }

  // FCM requires every data value to be a string.
  const data = Object.fromEntries(
    Object.entries(payload.data || {}).map(([key, value]) => [key, String(value)])
  );
  const channelId = payload.channelId ||
    (data.type === 'chat' ? 'atmosfit_chat' : 'atmosfit_default');

  const multicastMessage = {
    tokens,
    notification: {
      title: payload.title || 'AtmosFit Update',
      body: payload.body || '',
    },
    data,
    android: {
      priority: 'high',
      notification: {
        channelId,
      },
    },
  };

  const response = await messaging.sendEachForMulticast(multicastMessage);

  // Tokens die when the app is reinstalled or data is cleared; leaving them
  // active makes every later send log noise without ever delivering.
  response.responses.forEach((result, index) => {
    const code = result.error && result.error.code;
    if (code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token') {
      db.collection('device_tokens').doc(tokens[index])
        .set({ active: false }, { merge: true })
        .catch(() => {});
    }
  });

  return {
    sentCount: response.successCount,
    failedCount: response.failureCount,
  };
}

module.exports = {
  registerDevice,
  unregisterDevice,
  sendTestNotification,
  sendPushToUser,
};
