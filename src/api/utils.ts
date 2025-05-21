export const getErrorString = (errorStack: string | undefined) => {
  if (!errorStack) return "";
  const errorString = errorStack.split("\n")[0];
  return ` (${errorString})`;
};
