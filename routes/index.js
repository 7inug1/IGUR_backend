/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const router = express.Router();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AWS = require("aws-sdk");
const axios = require("axios");
const tf = require("@tensorflow/tfjs-node");
const cocoSsd = require("@tensorflow-models/coco-ssd");
const User = require("../models/User");

puppeteer.use(StealthPlugin());

class Report {
  constructor(reportId, profile, contents) {
    this.reportId = reportId;
    this.profile = profile;
    this.contents = contents;
  }
}

router.get("/users/:username/reports", function (req, res, next) {
  runMainCode();

  async function runMainCode() {
    async function checkUserInDB() {
      const username = req.params.username;
      let dbUser = null;

      try {
        dbUser = await User.findOne({ username });
      } catch (err) {
        return next(err);
      }

      return dbUser;
    };

    const dbUser = await checkUserInDB();

    res.json(dbUser);
  }
});

router.post("/users/:username/reports/:reportId", function (req, res, next) {
  runMainCode();

  async function runMainCode() {
    const numberOfCrawls = req.body.numberOfCrawls;
    const reportId = req.params.reportId;
    const username = req.params.username;

    let report = null;
    crawlInstagram(username);

    function crawlInstagram(enteredUsername) {
      (async () => {
        const s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(`https://www.picuki.com/profile/${enteredUsername}`, { waitUntil: "networkidle2" });

        const username = (await page.$eval(".wrapper .profile-header .content.clearfix .profile-info .profile-name .profile-name-top", (element) => {
          return element.textContent;
        })).substring(1);
        const name = await page.$eval(".wrapper .profile-header .content.clearfix .profile-info .profile-name .profile-name-bottom", (element) => {
          return element.textContent;
        });
        let profileImgSrc = await page.$eval(".wrapper .profile-header .content.clearfix .profile-info .profile-avatar-image", (element) => {
          return element.src;
        });
        const imgBuffer = await fetchImageInBuffer(profileImgSrc);

        try {
          const promise = await s3.upload({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: Date.now().toString(),
            Body: imgBuffer,
            ContentType: "image/jpeg",
          }).promise();
          profileImgSrc = promise.Location;
        } catch (err) {
          console.log("s3 err: ", err);
        }

        const profileImgAlt = await page.$eval(".wrapper .profile-header .content.clearfix .profile-info .profile-avatar-image", (element) => {
          return element.alt;
        });
        const introduction = await page.$eval("div.wrapper div.profile-header div.content.clearfix div.profile-description", (element) => {
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

        const NUMBER_OF_POSTS_TO_RETRIEVE = numberOfCrawls;
        const loadMoreButton = await page.$("button.pagination-failed-retry");
        const posts = [];
        const locations = {};
        const contents = {
          posts,
          locations,
        };
        let retrievedPostsHandles = await page.$$("ul.box-photos li");

        while (retrievedPostsHandles.length < NUMBER_OF_POSTS_TO_RETRIEVE) {
          await loadMoreButton.evaluate((b) => b.click());
          await page.waitForTimeout(1000);
          retrievedPostsHandles = await page.$$("ul.box-photos li");
        }

        let count = 0;

        for (let i = NUMBER_OF_POSTS_TO_RETRIEVE; i > 0; i--) {
          const id = numberOfPosts - 1 - count;
          const postElementHandle = retrievedPostsHandles[count];
          const description = await postElementHandle.$eval(".photo-info .photo-description", (element) => {
            return element.textContent.trim();
          });
          let imgSrc = await postElementHandle.$eval(".photo .post-image", (element) => {
            return element.src;
          });
          const imgBuffer = await fetchImageInBuffer(imgSrc);

          try {
            const promise = await s3.upload({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: Date.now().toString(),
              Body: imgBuffer,
              ContentType: "image/jpeg",
            }).promise();

            imgSrc = promise.Location;
          } catch (err) {
            console.log("s3 err: ", err);
          }

          const numberOfLikes = await postElementHandle.$eval(".post-footer .likes_photo", (element) => {
            return element.innerText;
          });
          const numberOfReplies = await postElementHandle.$eval(".post-footer .comments_photo", (element) => {
            return element.innerText;
          });
          const datePosted = await postElementHandle.$eval(".post-footer .time", (element) => {
            return element.textContent.trim();
          });

          let location = await getLocation(id);

          const prediction = await getPredictions(imgBuffer);

          const post = {
            id,
            location,
            imgSrc,
            description,
            numberOfLikes,
            numberOfReplies,
            datePosted,
            prediction,
          };

          contents.posts.push(post);
          count++;
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

        report = new Report(reportId, profile, contents);
        console.log("report", report);

        await processNaturalLanguage();

        const newReport = {
          id: reportId,
          profile: {
            username: report.profile.username,
            name: report.profile.name,
            profileImgSrc: report.profile.profileImgSrc,
            profileImgAlt: report.profile.profileImgAlt,
            introduction: report.profile.introduction,
            numberOfPosts: report.profile.numberOfPosts,
            numberOfFollowers: report.profile.numberOfFollowers,
            numberOfFollowings: report.profile.numberOfFollowings,
          },
          contents: {
            posts: report.contents.posts,
            locations: report.contents.locations,
          }
        };
        console.log("newReport", newReport);
        try {
          await User.findOneAndUpdate(
            { username: username },
            { $push: { reports: newReport } },
          );
        } catch (err) {
          console.log("save err:", err);
        }
        res.status(206).json({
          "report": newReport
        });
      })();
    }

    async function getLocation(id) {
      let location = null;

      try {
        location = await postElementHandle.$eval(".photo-info .photo-location .icon-globe-alt a", (element) => {
          return element.textContent;
        });

        contents.locations[id] = location;
      } catch (err) {
        location = null;
      }

      return location;
    }

    async function fetchImageInBuffer(url) {
      const res = await axios({ method: "get", url, responseType: "arraybuffer" });

      return res.data;
    }

    async function getPredictions(imgBuffer) {
      const Uint32Array = new Uint8Array(imgBuffer);

      const imgTensor = tf.node.decodeImage(Uint32Array);
      const model = await cocoSsd.load();
      const predictions = await model.detect(imgTensor);

      return predictions;
    }

    async function processNaturalLanguage() {
      const language = require("@google-cloud/language");
      const client = new language.LanguageServiceClient({
        credentials: JSON.parse(process.env.NL_KEY_JSON)
      });

      let sentimentsResult = null;
      let entitiesResult = null;
      let categoriesResult = null;

      for (const post of report.contents.posts) {
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
      }

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
    }
  }
});

router.get("/users/:username/reports/:reportId", function (req, res, next) {
  runMainCode();

  async function runMainCode() {
    async function checkUserInDB() {
      let dbUser = null;
      const username = req.params.username;
      const reportId = req.params.reportId;
      try {
        dbUser = await User.findOne({ username, "reports.id": reportId }, {"reports.$": 1});
      } catch (err) {
        return next(err);
      }

      return dbUser;
    };

    const dbUser = await checkUserInDB();

    res.json(dbUser);
  }
});

router.get("/users", function (req, res, next) {
  runMainCode();

  async function runMainCode() { 
    const dbUsers = await checkUserInDB();

    if (dbUsers) {
      res.json({
        dbUsers
      });
    }
  }

  async function checkUserInDB() {
    let dbUsers = null;

    try {
      dbUsers = await User.find();
    } catch (err) {
      return next(err);
    }

    return dbUsers;
  };

});

router.post("/users/:username", function (req, res, next) {
  runMainCode();

  async function runMainCode() {
    const numberOfCrawls = req.body.numberOfCrawls;
    const reportId = req.body.reportId;
    const username = req.params.username;
    let report = null;

    async function checkUserInDB() {
      let dbUser = null;

      try {
        dbUser = await User.findOne({ username });
      } catch (err) {
        return next(err);
      }

      return dbUser;
    };

    const dbUser = await checkUserInDB();

    if (!dbUser) {
      console.log("crawl ig");

      crawlInstagram();
    } else if(dbUser.username === username) {
      res.status(200).send({
        "user": dbUser
      });
      return;
    }

    function crawlInstagram() {
      (async () => {
        const s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(`https://www.picuki.com/profile/${req.params.username}`, { waitUntil: "networkidle2" });

        let privateNotif = null;

        try {
          privateNotif = await page.$eval(".wrapper .profile-header .content.clearfix .private-profile-top", (element) => {
            return element.textContent.trim();
          });
        } catch (err) {
          console.log("Private account dom doesn't exist.");
        }

        if (privateNotif === "Profile is private.") {
          res.sendStatus(214);
        } else {
          const username = (await page.$eval(".wrapper .profile-header .content.clearfix .profile-info .profile-name .profile-name-top", (element) => {
            return element.textContent;
          })).substring(1);
          const name = await page.$eval(".wrapper .profile-header .content.clearfix .profile-info .profile-name .profile-name-bottom", (element) => {
            return element.textContent;
          });
          let profileImgSrc = await page.$eval(".wrapper .profile-header .content.clearfix .profile-info .profile-avatar-image", (element) => {
            return element.src;
          });
          const imgBuffer = await fetchImageInBuffer(profileImgSrc);

          try {
            const promise = await s3.upload({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: Date.now().toString(),
              Body: imgBuffer,
              ContentType: "image/jpeg",
            }).promise();
            profileImgSrc = promise.Location;
          } catch (err) {
            console.log("s3 err: ", err);
          }

          const profileImgAlt = await page.$eval(".wrapper .profile-header .content.clearfix .profile-info .profile-avatar-image", (element) => {
            return element.alt;
          });
          const introduction = await page.$eval("div.wrapper div.profile-header div.content.clearfix div.profile-description", (element) => {
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

          const NUMBER_OF_POSTS_TO_RETRIEVE = numberOfCrawls;
          const loadMoreButton = await page.$("button.pagination-failed-retry");
          const posts = [];
          const locations = {};
          const contents = {
            posts,
            locations,
          };
          let retrievedPostsHandles = await page.$$("ul.box-photos li");

          while (retrievedPostsHandles.length < NUMBER_OF_POSTS_TO_RETRIEVE) {
            await loadMoreButton.evaluate((b) => b.click());
            await page.waitForTimeout(1000);
            retrievedPostsHandles = await page.$$("ul.box-photos li");
          }

          let count = 0;

          for (let i = NUMBER_OF_POSTS_TO_RETRIEVE; i > 0; i--) {
            const id = numberOfPosts - 1 - count;
            const postElementHandle = retrievedPostsHandles[count];
            const description = await postElementHandle.$eval(".photo-info .photo-description", (element) => {
              return element.textContent.trim();
            });
            let imgSrc = await postElementHandle.$eval(".photo .post-image", (element) => {
              return element.src;
            });
            const imgBuffer = await fetchImageInBuffer(imgSrc);

            try {
              const promise = await s3.upload({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: Date.now().toString(),
                Body: imgBuffer,
                ContentType: "image/jpeg",
              }).promise();
              imgSrc = promise.Location;
            } catch (err) {
              console.log("s3 err: ", err);
            }

            const numberOfLikes = await postElementHandle.$eval(".post-footer .likes_photo", (element) => {
              return element.innerText;
            });
            const numberOfReplies = await postElementHandle.$eval(".post-footer .comments_photo", (element) => {
              return element.innerText;
            });
            const datePosted = await postElementHandle.$eval(".post-footer .time", (element) => {
              return element.textContent.trim();
            });

            let location = await getLocation(id);

            const prediction = await getPredictions(imgBuffer);

            const post = {
              id,
              location,
              imgSrc,
              description,
              numberOfLikes,
              numberOfReplies,
              datePosted,
              prediction,
            };

            contents.posts.push(post);
            count++;
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

          report = {
            id: reportId,
            profile: {
              username: profile.username,
              name: profile.name,
              profileImgSrc: profile.profileImgSrc,
              profileImgAlt: profile.profileImgAlt,
              introduction: profile.introduction,
              numberOfPosts: profile.numberOfPosts,
              numberOfFollowers: profile.numberOfFollowers,
              numberOfFollowings: profile.numberOfFollowings,
            },
            contents: {
              posts: contents.posts,
              locations: contents.locations,
            }
          };

          await processNaturalLanguage();

          const user = new User({
            username: report.profile.username,
            reports: [
              report
            ],
          });

          console.log("report", report);

          await user.save();

          res.sendStatus(204);
        }
      })();
    }

    async function getLocation(id) {
      let location = null;

      try {
        location = await postElementHandle.$eval(".photo-info .photo-location .icon-globe-alt a", (element) => {
          return element.textContent;
        });

        contents.locations[id] = location;
      } catch (err) {
        location = null;
      }

      return location;
    }

    async function fetchImageInBuffer(url) {
      const res = await axios({ method: "get", url, responseType: "arraybuffer" });

      return res.data;
    }

    async function getPredictions(imgBuffer) {
      const Uint32Array = new Uint8Array(imgBuffer);

      const imgTensor = tf.node.decodeImage(Uint32Array);
      const model = await cocoSsd.load();
      const predictions = await model.detect(imgTensor);

      return predictions;
    }

    async function processNaturalLanguage() {
      const language = require("@google-cloud/language");
      const client = new language.LanguageServiceClient({
        credentials: JSON.parse(process.env.NL_KEY_JSON)
      });

      let sentimentsResult = null;
      let entitiesResult = null;
      let categoriesResult = null;

      for (const post of report.contents.posts) {
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
      }

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
    }
  }
});

module.exports = router;
