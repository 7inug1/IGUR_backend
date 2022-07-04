/* eslint-disable no-unused-vars */
const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");

class InstagramUser {
  constructor(profile, contents, locations) {
    this.profile = profile;
    this.contents = contents;
    this.locations = locations;
  }
}

router.get("/users/:username", function (req, res, next) {
  let instagramUser = null;

  crawlInstagram();

  function crawlInstagram() {
    (async () => {
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(`https://www.picuki.com/profile/${req.params.username}`, { waitUntil: "networkidle2" });

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
      const numberOfFollowers = await page.$eval("div.wrapper div.content .followed_by", (element) => {
        return Number(`${element.textContent}`.replaceAll(",", ""));
      });
      const numberOfFollowings = await page.$eval("div.wrapper div.content .follows", (element) => {
        return Number(`${element.textContent}`.replaceAll(",", ""));
      });

      // <post>
      const NUMBER_OF_POSTS_TO_RETRIEVE = 10; // numberOfPosts
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
      let count = 0;
      for (let i = NUMBER_OF_POSTS_TO_RETRIEVE; i > 0; i--) {
        const id = numberOfPosts - 1 - count;
        const postElementHandle = retrievedPostsHandles[count];
        count++;
        const description = await postElementHandle.$eval(".photo-info .photo-description", (element) => {
          return element.textContent.trim();
        });
        const imgSrc = await postElementHandle.$eval(".photo .post-image", (element) => {
          return element.src;
        });
        const numberOfLikes = await postElementHandle.$eval(".post-footer .likes_photo", (element) => {
          return element.innerText;
        });
        const numberOfReplies = await postElementHandle.$eval(".post-footer .comments_photo", (element) => {
          return element.innerText;
        });
        const datePosted = await postElementHandle.$eval(".post-footer .time", (element) => {
          return element.textContent.trim();
        });
        let location = null;

        try {
          location = await postElementHandle.$eval(".photo-info .photo-location .icon-globe-alt a", (element) => {
            return element.textContent;
          });
          locations[id] = location;
        } catch (err) {
          location = null;
        }
        const post = {
          id,
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

      instagramUser = new InstagramUser(profile, contents, locations);

      processNaturalLanguage();
    })();
  }

  async function processNaturalLanguage() {
    const language = require("@google-cloud/language");
    const client = new language.LanguageServiceClient({
      keyFilename: "key.json",
    });

    let sentimentsResult = null;
    let entitiesResult = null;
    let categoriesResult = null;

    for (const post of instagramUser.contents.posts) {
      const document = {
        content: post.description,
        type: "PLAIN_TEXT",
      };

      sentimentsResult = await analyzeSentiment(document);
      entitiesResult = await analyzeEntities(document);
      categoriesResult = await classifyContent(document);

      post["sentimentsResult"] = sentimentsResult;
      post["entitiesResult"] = entitiesResult;
      post["categoriesResult"] = categoriesResult;

      console.log("post", post);
      console.log("post.sentimentsResult", post.sentimentsResult);
    }

    // app.get("/", (req, res) => {
    //   res.send(instagramUser);
    // });

    async function analyzeSentiment(document) {
      let sentimentsResult = null;

      try {
        [sentimentsResult] = await client.analyzeSentiment({ document });
      } catch (err) {
        sentimentsResult = null;
      }

      return sentimentsResult;
    }

    async function analyzeEntities(document) {
      let entitiesResult = null;

      try {
        [entitiesResult] = await client.analyzeEntities({ document });
      } catch (err) {
        entitiesResult = null;
      }

      return entitiesResult;
    }

    async function classifyContent(document) {
      let categoriesResult = null;

      try {
        [categoriesResult] = await client.classifyText({ document });
      } catch (err) {
        categoriesResult = null;
      }

      return categoriesResult;
    }
    res.send(instagramUser);
  }
});

module.exports = router;
