const TOKEN_KEY = "token";
const USER_KEY = "user";
const PROFILE_NAMES_KEY = "profileNames";
const PROFILE_PICTURES_KEY = "profilePictures";

function getUserProfileKey(user) {
  return user?.id || user?.email || user?.name || null;
}

function getStoredProfilePictures() {
  const rawPictures = localStorage.getItem(PROFILE_PICTURES_KEY);

  if (!rawPictures) {
    return {};
  }

  try {
    const pictures = JSON.parse(rawPictures);
    return pictures && typeof pictures === "object" ? pictures : {};
  } catch {
    localStorage.removeItem(PROFILE_PICTURES_KEY);
    return {};
  }
}

function getStoredProfileNames() {
  const rawNames = localStorage.getItem(PROFILE_NAMES_KEY);

  if (!rawNames) {
    return {};
  }

  try {
    const names = JSON.parse(rawNames);
    return names && typeof names === "object" ? names : {};
  } catch {
    localStorage.removeItem(PROFILE_NAMES_KEY);
    return {};
  }
}

function getStoredProfileName(user) {
  const profileKey = getUserProfileKey(user);

  if (!profileKey) {
    return null;
  }

  return getStoredProfileNames()[profileKey] || null;
}

function getStoredProfilePicture(user) {
  const profileKey = getUserProfileKey(user);

  if (!profileKey) {
    return null;
  }

  return getStoredProfilePictures()[profileKey] || null;
}

function saveStoredProfileName(user) {
  const profileKey = getUserProfileKey(user);

  if (!profileKey || !user?.name) {
    return;
  }

  const names = getStoredProfileNames();
  names[profileKey] = user.name;
  localStorage.setItem(PROFILE_NAMES_KEY, JSON.stringify(names));
}

function saveStoredProfilePicture(user) {
  const profileKey = getUserProfileKey(user);

  if (!profileKey || !user?.profilePicture) {
    return;
  }

  const pictures = getStoredProfilePictures();
  pictures[profileKey] = user.profilePicture;
  localStorage.setItem(PROFILE_PICTURES_KEY, JSON.stringify(pictures));
}

function notifyStoredUserChanged() {
  window.dispatchEvent(new Event("stored-user-changed"));
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser);
    return user && typeof user === "object" ? user : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setStoredAuth(token, user) {
  const profileName = getStoredProfileName(user);
  const profilePicture = getStoredProfilePicture(user);
  const userWithProfile = {
    ...user,
    ...(profileName ? { name: profileName } : {}),
    ...(profilePicture ? { profilePicture } : {}),
  };

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(userWithProfile));
  notifyStoredUserChanged();
}

export function setStoredUser(user) {
  saveStoredProfileName(user);
  saveStoredProfilePicture(user);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyStoredUserChanged();
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyStoredUserChanged();
}

export function isAdminUser(user) {
  return String(user?.role || "").trim().toLowerCase() === "admin";
}
