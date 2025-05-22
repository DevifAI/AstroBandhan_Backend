import AgoraAccessToken from "agora-access-token";
export const generateAgoraToken = (channelName, uid) => {
  const appID = process.env.AGORAAPPID;
  const appCertificate = process.env.AGORACERTIFICATE;
  const expireTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;
  const role = AgoraAccessToken.RtcRole.PUBLISHER;
  const token = AgoraAccessToken.RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    parseInt(uid),
    role,
    privilegeExpiredTs
  );
  return token;
};

export function formatDateToTimeString(date) {
  const options = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  // Example output: "May 23, 2025, 1:53 AM"
  // We want: "May 23, 2025 at 1:53 AM"

  // Get localized string with commas
  const localeString = date.toLocaleString("en-US", options);

  // Replace the second comma with " at"
  // "May 23, 2025, 1:53 AM" -> "May 23, 2025 at 1:53 AM"
  return localeString.replace(/, (\d{1,2}:\d{2} [AP]M)/, " at $1");
}
