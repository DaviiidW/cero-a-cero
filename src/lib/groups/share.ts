export function getWhatsAppShareLink(
  groupName: string,
  inviteCode: string,
  inviteLink: string
): string {
  const message = `¡Únete a "${groupName}" en Cero a Cero! \n\nCódigo: ${inviteCode}\nEnlace: ${inviteLink}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
