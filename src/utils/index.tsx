

export function formatDate(value?: string) {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "numeric" });
  } catch {
    return value;
  }
}


export function sliceLongNames(maxLength: number, name?: string) {
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + '...';
}


export const generateTempNumericId = () => {
  const mathRandom = Math.floor(Math.random() * 1000);
  return Date.now() * 1000 + mathRandom;
};