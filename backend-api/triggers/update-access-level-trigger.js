// Trigger function to prevent a student from being updated to an admin
export function updateAccessTrigger(documentRole) {
  for (let i = 0; i < documentRole.length; i++) {
    if (documentRole[i].role === "student") {
      return false;
    }
    return true;
  }
}
