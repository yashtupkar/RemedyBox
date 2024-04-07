var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const commentModel = require("./comments");
const passport = require("passport");
const upload = require("./multer");
const fs = require("fs");
const path = require("path");
const localStrategy = require("passport-local");
const users = require("./users");
const posts = require("./posts");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get("/", function (req, res, next) {
  const error = req.flash("error");
  res.render("login", { error });
});

//login
router.get("/login", function (req, res, next) {
  const error = req.flash("error");
  res.render("login", { error });
});

//register
router.get("/register", function (req, res, next) {
  res.render("register", { title: "Express" });
});



//index
router.get("/index", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("index", { user });
});

//about
router.get("/about", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  res.render("about", { user });
});
//contact
router.get("/contact", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  res.render("contact", { user });
});
//search route
router.get("/search", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate("user");
  try {
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 4;

    const postdata = await postModel
      .find({
        $or: [
          { title: { $regex: ".*" + search + ".*", $options: "i" } },
          { discription: { $regex: ".*" + search + ".*", $options: "i" } },
          { ingredients: { $regex: ".*" + search + ".*", $options: "i" } },
          { disclaimer: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    //for page buttons

    const count = await postModel
      .find({
        $or: [
          { title: { $regex: ".*" + search + ".*", $options: "i" } },
          { discription: { $regex: ".*" + search + ".*", $options: "i" } },
          { ingredients: { $regex: ".*" + search + ".*", $options: "i" } },
          { disclaimer: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .countDocuments();

    res.render("search", {
      user,
      posts: postdata,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      previousPage: parseInt(page) - 1,
      nextPage: parseInt(page) + 1,
    });
  } catch (err) {
    console.log(err);
  }
});

//profile
router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");

  res.render("profile", { user });
});

//editprofile
router.get("/editprofile", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  res.render("editprofile", { user });
});

//editpost get route
router.get("/editpost/:id", isLoggedIn, async (req, res, next) => {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    if (!user) {
      // Handle case where user is not found
      return res.status(404).send("User not found");
    }

    const post = await postModel.findById(req.params.id);
    if (!post) {
      // Handle case where post with given ID is not found
      return res.status(404).send("Post not found");
    }

    res.render("editpost", { user, post });
  } catch (error) {
    // Handle any errors that occur during the database query
    next(error);
  }
});

//createposts
router.get("/createposts", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  res.render("createposts", { user });
});
//logout
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// route for eact remedy
router.get("/:id", isLoggedIn, async (req, res) => {
  try {
    const comments = await commentModel
      .find({ postId: req.params.id })
      .populate("user");
    const user = await userModel
      .findOne({ username: req.session.passport.user })
      .populate("posts");
    const remedy = await postModel.findById(req.params.id).populate("user");
    if (!remedy) {
      res.status(404).send("Remedy not found");
      return;
    }

    res.render("remedy", { remedy, user, comments });
  } catch (err) {
    console.error("Error fetching remedy:", err);
    res.status(500).send("Internal Server Error");
  }
});

// delete posst route
router.get("/delete/:id", async (req, res, next) => {
  try {
    const postId = req.params.id;
    const deletedPost = await posts.findByIdAndDelete(postId);
    if (!deletedPost) {
      // Handle case where the post doesn't exist
      return res.status(404).send("Post not found");
    }

    // Extract the user ID associated with the deleted post
    const userId = deletedPost.user; // Assuming there's a field 'user' in the post document storing the user ID

    // Remove the post ID from the user's posts array
    const updatedUser = await users.findOneAndUpdate(
      { _id: userId }, // Filter to find the user by their ID
      { $pull: { posts: postId } }, // Remove the post ID from the user's posts array
      { new: true } // Return the updated user document
    );

    // Redirect to profile page
    res.redirect("/profile");
  } catch (err) {
    console.error("Error deleting post:", err);
    next(err);
  }
});

//editpost post route
router.post(
  "/editpost/:id",
  isLoggedIn,
  upload.single("file"),
  async function (req, res, next) {
    try {
      let updateFields = {
        title: req.body.title,
        discription: req.body.discription,
        ingredients: req.body.ingredients,
        dosage: req.body.dosage,
        disclaimer: req.body.disclaimer,
        videoLink: req.body.videolink,
      };

      // Check if a file was uploaded
      if (req.file) {
        updateFields.postImage = req.file.filename;
      }

      const updatedPost = await postModel.findOneAndUpdate(
        { _id: req.params.id },
        { $set: updateFields },
        { new: true }
      );

      if (!updatedPost) {
        return res.status(404).send("Post not found");
      }

      res.redirect("/profile");
    } catch (error) {
      next(error);
    }
  }
);

//profile
router.post("/profileDetail", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  user.handel = req.body.handel;
  user.bio = req.body.bio;
  await user.save();
  res.redirect("/profile");
});

//upload
router.post(
  "/upload",
  isLoggedIn,
  upload.single("file"),
  async function (req, res, next) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    user.profileImage = req.file.filename;
    await user.save();
    res.redirect("/editprofile");
  }
);

//postupload
router.post(
  "/postupload",
  isLoggedIn,
  upload.single("file"),
  async function (req, res, next) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const postdata = await postModel.create({
      postImage: req.file.filename,

      title: req.body.title,
      discription: req.body.discription,
      ingredients: req.body.ingredients,
      dosage: req.body.dosage,
      disclaimer: req.body.disclaimer,
      videoLink: req.body.videolink,
      user: user._id,
    });

    user.posts.push(postdata._id);
    await user.save();
    res.redirect("/profile");
  }
);

//comment
router.post("/comment/:postId", isLoggedIn, async (req, res, next) => {
  try {
    // Find the user by username
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    // Create a new comment
    const comment = await commentModel.create({
      comment: req.body.comment,
      postId: req.params.postId,
      user: user._id, //
    });

    // Redirect to the post page after creating the comment
    return res.redirect(`/${req.params.postId}`);
  } catch (error) {
    // Handle errors
    return next(error);
  }
});

// Register
router.post("/register", function (req, res, next) {
  const { username, email, password } = req.body;
  const userdata = new userModel({ username, email, password });

  userModel
    .register(userdata, req.body.password)
    .then(function (registereduser) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/index");
      });
    });
});

//login
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/",
    successRedirect: "/index",
    failureFlash: true,
  }),
  function (req, res) {}
);

// function isloggedin
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

module.exports = router;
