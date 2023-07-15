export function User(
  id,
  email,
  password,
  role,
  firstName,
  lastName,
  lastLogin,
  authenticationKey
) {
  return {
    id,
    email,
    password,
    role,
    firstName,
    lastName,
    lastLogin,
    authenticationKey,
  };
}
