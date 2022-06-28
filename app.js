/* eslint-disable no-unused-vars */
require("dotenv").config();
const puppeteer = require("puppeteer");
// elonrmuskk
// jiyongkim_official
// mason_lisa
// michelilove_88
const USERNAME = "mason_lisa";

(async () => {
  class InstagramUser {
    constructor(username, name, profileImgSrc, introduction, numberOfPosts, numberOfFollowers, numberOfFollowings) {
      this.username = username;
      this.name = name;
      this.profileImgSrc = profileImgSrc;
      this.introduction = introduction;
      this.numberOfPosts = numberOfPosts;
      this.numberOfFollowers = numberOfFollowers;
      this.numberOfFollowings = numberOfFollowings;
    }
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(`https://www.picuki.com/profile/${USERNAME}`, { waitUntil: "networkidle2" });

  // <profile>
  const instagramUser = new InstagramUser();

  const content = await page.$("div.wrapper div.content");
  const profileHeader = await page.$(".wrapper .profile-header");
  console.log("content", content);

  const username = await profileHeader.$eval(".profile-info .profile-name-top", (element) => {
    return element.textContent;
  });
  const name = await profileHeader.$eval(".profile-info .profile-name-bottom", (element) => {
    return element.textContent;
  });
  const profileImgSrc = await profileHeader.$eval(".profile-avatar .profile-avatar-image", (element) => {
    return element.src;
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

  console.log("username", username);
  console.log("name", name);
  console.log("profileImgSrc", profileImgSrc);
  console.log("introduction", introduction);
  console.log("numberOfPosts", numberOfPosts);
  console.log("numberOfFollowers", numberOfFollowers);
  console.log("numberOfFollowings", numberOfFollowings);

  // <post>
  const loadMoreButton = await page.$("button.pagination-failed-retry");
  const locations = {};
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
    try {
      const location = await postElementHandle.$eval(".photo-info .photo-location .icon-globe-alt a", (element) => {
        return element.textContent;
      });
      locations[i] = location;
    } catch (err) {
      // console.log(`location doesn't exist for post ${i}`);
    }
    console.log("description", description);
    console.log("imgSrc", imgSrc);
    console.log("numberOfLikes", numberOfLikes);
    console.log("numberOfReplies", numberOfReplies);
    console.log("datePosted", datePosted);
  }
  console.log("locations", locations);
})();
