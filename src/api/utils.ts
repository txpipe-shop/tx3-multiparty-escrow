export const getErrorString = (errorStack: string | undefined) => {
  if (errorStack) {
    const errorString = errorStack.split("\n")[0];
    if (errorString.includes("Error:")) return errorString.split("Error:")[1];
    return `${errorString.trim()}`;
  }
  return "Internal server error";
};
