import fetch from "node-fetch";

const UserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 239.2.0.17.109 (iPhone12,1; iOS 15_5; en_US; en-US; scale=2.00; 828x1792; 376668393)";

export default class InstagramProfilePictures {
  constructor(sessionId) {
    this.sessionId = sessionId;
  }

  async fetchProfilePictureURL(username) {
    try {
      let json = await fetchAndReturnJSON(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`);
      if (json == null) {
        return null;
      }
      
      const userId = json.data.user.id;
      json = await fetchAndReturnJSON(`https://i.instagram.com/api/v1/users/${userId}/info`, this.sessionId);
      if (json == null) {
        return null;
      }
      
      return json.user.hd_profile_pic_url_info.url;
    } catch (err) {
      return null;
    }
  }
}

const fetchAndReturnJSON = async (url, sessionId) => {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UserAgent,
        "cookie": `sessionid=${sessionId}`,
      },
    });
    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (err) {
    return null;
  }
}
