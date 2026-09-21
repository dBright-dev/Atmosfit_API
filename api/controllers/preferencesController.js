const {getFirestore} = require('firebase-admin/firestore');

const db = getFirestore();


async function getUserPreferences(userId) {
  try {
    // const prefsRef = db.ref(`userPreferences/${userId}`);
    const userDoc = await db.collection('users').doc(userId).get();

    //     const snapshot = await prefsRef.once('value');

    //     if (snapshot.exists()){
    //         return { ...DEFAULT_PREFERENCES, ...snapshot.val() };
    //     }

    //     await prefsRef.set(DEFAULT_PREFERENCES);
    //     return { ...DEFAULT_PREFERENCES };
    if (!userDoc.exists) {
      return {
        themeMode: 'system',
        temperatureUnit: 'celsius',
        comfortCalibrator: 0.5,
      };
    }

    const data = userDoc.data();
    return data.preferences || {};
  } catch (error) {
    console.error('Error fetching user preferences: ', error);
    throw new Error('Failed to fetch preferences.');
  }
}

async function updateUserPreferences(userId, preferences) {
  try {
    const validated = {};

    if (preferences.themeMode !== undefined) {
      if (!['light', 'dark', 'system'].includes(preferences.themeMode)) {
        throw new Error('Invalid theme mode. Must be light,dark or system');
      }
      validated.themeMode = preferences.themeMode;
    }

    if (preferences.temperatureUnit !== undefined) {
      if (!['celsius', 'fahrenheit'].includes(preferences.temperatureUnit)) {
        throw new Error('Invalid temperature unit. Must be celsius or fahrenheit.');
      }
      validated.temperatureUnit = preferences.temperatureUnit;
    }

    if (preferences.comfortCalibrator !== undefined) {
      const sliderValue = parseFloat(preferences.comfortCalibrator);
      if (isNaN(sliderValue) || sliderValue < 0 || sliderValue > 1) {
        throw new Error('Comfort calibrator must be a number between 0 and 1.');
      }
      validated.comfortCalibrator = sliderValue;
    }

    validated.updatedAt = Date.now();

    // const prefsRef = db.ref(`userPreferences/${userId}`);

    await db.collection('users').doc(userId).set(
        {preferences: validated},
        {merge: true},
    );

    // await prefsRef.update(validated);
    return await getUserPreferences(userId);
  } catch (error) {
    console.error('Error updating preferences: ', error);
    throw error;
  }
}

module.exports = {
  getUserPreferences,
  updateUserPreferences,
};
/*
Reference List:
http://firebase.google.com/docs/database/admin/start
https://firebase.google.com/docs/database/admin/retrieve-data
https://firebase.google.com/docs/database/admin/save-data
*/
