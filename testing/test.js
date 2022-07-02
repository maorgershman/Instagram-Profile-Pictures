import { getCurrentChromeInstagramSessionId } from "./utils.js";

import InstagramProfilePictures from "../index.js";

// Extract the current session ID of a logged in user in Instagram web in Windows.
const sessionId = await getCurrentChromeInstagramSessionId();
const handler = new InstagramProfilePictures(sessionId);
const url = await handler.fetchProfilePictureURL("cristiano");
console.log(url);