/* eslint-disable no-unused-vars */
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 8000;
const puppeteer = require("puppeteer");

const { Storage } = require("@google-cloud/storage");
const storage = new Storage();

// elonrmuskk
// jiyongkim_official
// mason_lisa
// michelilove_88
const USERNAME = "mason_lisa";
const crawledData = {};

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});

// async function quickstart() {
//   // Imports the Google Cloud client library
//   const language = require("@google-cloud/language");

//   // Instantiates a client
//   const client = new language.LanguageServiceClient({
//     keyFilename: "key.json",
//   });

//   // The text to analyze
//   const text = "Hello, world!";

//   const document = {
//     content: text,
//     type: "PLAIN_TEXT",
//   };

//   // Detects the sentiment of the text
//   const [result] = await client.analyzeSentiment({ document: document });
//   const sentiment = result.documentSentiment;

//   console.log(`Text: ${text}`);
//   console.log(`Sentiment score: ${sentiment.score}`);
//   console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
// }

// quickstart();

(async () => {
  class InstagramUser {
    constructor(profile, contents) {
      this.profile = profile;
      this.contents = contents;
    }
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(`https://www.picuki.com/profile/${USERNAME}`, { waitUntil: "networkidle2" });

  // <profile>
  const content = await page.$("div.wrapper div.content");
  const profileHeader = await page.$(".wrapper .profile-header");

  const username = await profileHeader.$eval(".profile-info .profile-name-top", (element) => {
    return element.textContent;
  });
  const name = await profileHeader.$eval(".profile-info .profile-name-bottom", (element) => {
    return element.textContent;
  });
  const profileImgSrc = await profileHeader.$eval(".profile-avatar .profile-avatar-image", (element) => {
    return element.src;
  });
  const profileImgAlt = await profileHeader.$eval(".profile-avatar .profile-avatar-image", (element) => {
    return element.alt;
  });
  const introduction = await profileHeader.$eval(".profile-description", (element) => {
    return element.textContent.trim();
  });
  const numberOfPosts = await page.$eval("div.wrapper div.content .total_posts", (element) => {
    return Number(`${element.textContent}`.replaceAll(",", ""));
  });
  const NUMBER_OF_POSTS_TO_RETRIEVE = numberOfPosts;
  const numberOfFollowers = await page.$eval("div.wrapper div.content .followed_by", (element) => {
    return Number(`${element.textContent}`.replaceAll(",", ""));
  });
  const numberOfFollowings = await page.$eval("div.wrapper div.content .follows", (element) => {
    return Number(`${element.textContent}`.replaceAll(",", ""));
  });

  // <post>
  const loadMoreButton = await page.$("button.pagination-failed-retry");
  const locations = {};
  const posts = [];
  const contents = {
    posts,
  };
  let retrievedPostsHandles = await page.$$("ul.box-photos li");

  while (retrievedPostsHandles.length < NUMBER_OF_POSTS_TO_RETRIEVE) {
    await loadMoreButton.evaluate((b) => b.click());
    await page.waitForTimeout(1000);
    retrievedPostsHandles = await page.$$("ul.box-photos li");
    console.log("retrievedPostsHandles.length", retrievedPostsHandles.length);
  }

  for (let i = 0; i < NUMBER_OF_POSTS_TO_RETRIEVE; i++) {
    const postElementHandle = retrievedPostsHandles[i];
    const description = await postElementHandle.$eval(".photo-info .photo-description", (element) => {
      return element.textContent.trim();
    });
    const imgSrc = await postElementHandle.$eval(".photo .post-image", (element) => {
      return element.src;
    });
    const numberOfLikes = await postElementHandle.$eval(".post-footer .likes_photo", (element) => {
      return Number(element.textContent);
    });
    const numberOfReplies = await postElementHandle.$eval(".post-footer .comments_photo", (element) => {
      return Number(element.textContent);
    });
    const datePosted = await postElementHandle.$eval(".post-footer .time", (element) => {
      return element.textContent.trim();
    });
    let location = null;
    try {
      location = await postElementHandle.$eval(".photo-info .photo-location .icon-globe-alt a", (element) => {
        return element.textContent;
      });
    } catch (err) {
      console.log(`location doesn't exist for post ${i}`);
      location = null;
    }
    const post = {
      location,
      imgSrc,
      description,
      numberOfLikes,
      numberOfReplies,
      datePosted,
    };
    contents.posts.push(post);
  }
  const profile = {
    username,
    name,
    profileImgSrc,
    profileImgAlt,
    introduction,
    numberOfPosts,
    numberOfFollowers,
    numberOfFollowings,
  };

  const instagramUser = new InstagramUser(profile, contents);
  console.log("instagramUser", instagramUser.contents.posts);
})();
