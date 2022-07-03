/* eslint-disable no-unused-vars */
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 8000;
const puppeteer = require("puppeteer");
const MOCK_DATA = require("./mock_data.json");

// elonrmuskk
// jiyongkim_official
// mason_lisa
// michelilove_88
const USERNAME = "mason_lisa";

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});

class InstagramUser {
  constructor(profile, contents, locations) {
    this.profile = profile;
    this.contents = contents;
    this.locations = locations;
  }
}

// function crawlInstagram() {
//   (async () => {
//     const browser = await puppeteer.launch({ headless: false });
//     const page = await browser.newPage();
//     await page.setViewport({ width: 1920, height: 1080 });
//     await page.goto(`https://www.picuki.com/profile/${USERNAME}`, { waitUntil: "networkidle2" });

//     // <profile>
//     const content = await page.$("div.wrapper div.content");
//     const profileHeader = await page.$(".wrapper .profile-header");
//     const username = await profileHeader.$eval(".profile-info .profile-name-top", (element) => {
//       return element.textContent;
//     });
//     const name = await profileHeader.$eval(".profile-info .profile-name-bottom", (element) => {
//       return element.textContent;
//     });
//     const profileImgSrc = await profileHeader.$eval(".profile-avatar .profile-avatar-image", (element) => {
//       return element.src;
//     });
//     const profileImgAlt = await profileHeader.$eval(".profile-avatar .profile-avatar-image", (element) => {
//       return element.alt;
//     });
//     const introduction = await profileHeader.$eval(".profile-description", (element) => {
//       return element.textContent.trim();
//     });
//     const numberOfPosts = await page.$eval("div.wrapper div.content .total_posts", (element) => {
//       return Number(`${element.textContent}`.replaceAll(",", ""));
//     });
//     const NUMBER_OF_POSTS_TO_RETRIEVE = numberOfPosts; // comment
//     const numberOfFollowers = await page.$eval("div.wrapper div.content .followed_by", (element) => {
//       return Number(`${element.textContent}`.replaceAll(",", ""));
//     });
//     const numberOfFollowings = await page.$eval("div.wrapper div.content .follows", (element) => {
//       return Number(`${element.textContent}`.replaceAll(",", ""));
//     });

//     // <post>
//     const loadMoreButton = await page.$("button.pagination-failed-retry");
//     const locations = {};
//     const posts = [];
//     const contents = {
//       posts,
//     };
//     let retrievedPostsHandles = await page.$$("ul.box-photos li");

//     while (retrievedPostsHandles.length < NUMBER_OF_POSTS_TO_RETRIEVE) {
//       await loadMoreButton.evaluate((b) => b.click());
//       await page.waitForTimeout(1000);
//       retrievedPostsHandles = await page.$$("ul.box-photos li");
//       console.log("retrievedPostsHandles.length", retrievedPostsHandles.length);
//     }

//     for (let i = 0; i < NUMBER_OF_POSTS_TO_RETRIEVE; i++) {
//       const postElementHandle = retrievedPostsHandles[i];
//       const id = NUMBER_OF_POSTS_TO_RETRIEVE - i - 1;
//       const description = await postElementHandle.$eval(".photo-info .photo-description", (element) => {
//         return element.textContent.trim();
//       });
//       const imgSrc = await postElementHandle.$eval(".photo .post-image", (element) => {
//         return element.src;
//       });
//       const numberOfLikes = await postElementHandle.$eval(".post-footer .likes_photo", (element) => {
//         return Number(element.textContent);
//       });
//       const numberOfReplies = await postElementHandle.$eval(".post-footer .comments_photo", (element) => {
//         return Number(element.textContent);
//       });
//       const datePosted = await postElementHandle.$eval(".post-footer .time", (element) => {
//         return element.textContent.trim();
//       });
//       let location = null;
//       try {
//         location = await postElementHandle.$eval(".photo-info .photo-location .icon-globe-alt a", (element) => {
//           return element.textContent;
//         });
//         locations[id] = location;
//       } catch (err) {
//         console.log(`location doesn't exist for post ${i}`);
//         location = null;
//       }
//       const post = {
//         id,
//         location,
//         imgSrc,
//         description,
//         numberOfLikes,
//         numberOfReplies,
//         datePosted,
//       };
//       contents.posts.push(post);
//     }
//     const profile = {
//       username,
//       name,
//       profileImgSrc,
//       profileImgAlt,
//       introduction,
//       numberOfPosts,
//       numberOfFollowers,
//       numberOfFollowings,
//     };

//     const instagramUser = new InstagramUser(profile, contents, locations);
//     console.log("instagramUser", instagramUser.contents.posts);
//     console.log("locations", locations);
//     app.get("/", (req, res) => {
//       res.send(instagramUser);
//     });
//   })();
// }

// crawlInstagram();

const language = require("@google-cloud/language");
const client = new language.LanguageServiceClient({
  keyFilename: "key.json",
});

const text = "Top Gun is a 1986 American action drama film directed by Tony Scott, and produced by Don Simpson and Jerry Bruckheimer, in association with Paramount Pictures.";

const document = {
  content: text,
  type: "PLAIN_TEXT",
};

// analyzeSentiment(document);
// analyzeEntities(document);
classifyContent(document);
async function analyzeSentiment(document) {
  try {
    const [result] = await client.analyzeSentiment({ document });
    console.log("result", result);

    const sentiment = result.documentSentiment;

    console.log("Document sentiment:");
    console.log(`  Score: ${sentiment.score}`);
    console.log(`  Magnitude: ${sentiment.magnitude}`);

    const sentences = result.sentences;
    sentences.forEach((sentence) => {
      console.log(`Sentence: ${sentence.text.content}`);
      console.log(`  Score: ${sentence.sentiment.score}`);
      console.log(`  Magnitude: ${sentence.sentiment.magnitude}`);
    });

    app.get("/", (req, res) => {
      res.send(result);
    });
  } catch (err) {
    console.log("sentiment error", err);
  }
}

async function analyzeEntities(document) {
  try {
    const [result] = await client.analyzeEntities({ document });
    console.log("result", result);

    const entities = result.entities;

    console.log("Entities:");
    entities.forEach((entity) => {
      console.log(entity.name);
      console.log(` - Type: ${entity.type}, Salience: ${entity.salience}`);
      if (entity.metadata && entity.metadata.wikipedia_url) {
        console.log(` - Wikipedia URL: ${entity.metadata.wikipedia_url}`);
      }
    });

    app.get("/", (req, res) => {
      res.send(result);
    });
  } catch (err) {
    console.log("entities error", err);
  }
}

async function classifyContent(document) {
  try {
    const [classification] = await client.classifyText({ document });
    console.log("Categories:");
    classification.categories.forEach((category) => {
      console.log(`Name: ${category.name}, Confidence: ${category.confidence}`);
    });
    app.get("/", (req, res) => {
      res.send(classification);
    });
  } catch (err) {
    console.log("classify error", err);
  }
}
