const pad = (value: number) => value.toString().padStart(2, "0");

export const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const formatLocalTime = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;
