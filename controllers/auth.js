const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const User = require('../models/user');
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for port 587
  auth: {
    user: process.env.USER, // sender gmail address
    pass: process.env.APP_PASSWORD, // app password from email account
  },
});

// const mailOptions = {
//   from: {
//     name: "Bookstore",
//     address: process.env.USER,
//   }, // sender address
//   to: ["shashikira4124@gmail.com"], // list of receivers
//   subject: "sending email with node mailer", // Subject line
//   text: "Hello world?", // plain text body
//   html: "<b>Hello world?</b>", // html body
//   attachments: [
//     {
//       filename: '.gitignore',
//       path: './.gitignore',
//     }
//   ]
// };

const sendMail = async (transporter, mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (err) {
    console.log("Error sending email", err);
  }
};

// sendMail(transporter, mailOptions);

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(result => {
      res.redirect('/login');

        return transporter.sendMail({
  to: email,
  from: '"Welcome Team" <welcome@app.com>',
  subject: 'Welcome to ShoppingApp! 🎉',
  html: `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <tr>
        <td bgcolor="#ffffff" style="padding: 40px 30px; text-align: center;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">Welcome to ShoppingApp!</h1>
        </td>
      </tr>
      <tr>
        <td bgcolor="#f8f9fa" style="padding: 40px 30px;">
          <h2 style="color: #2c3e50; margin-top: 0;">Account Created Successfully!</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${userName || 'there'},<br><br>
            Thank you for joining ShoppingApp! Your account has been successfully created. Here are your account details:
          </p>
          <table cellpadding="10" style="background: #ffffff; margin: 20px 0; border-radius: 8px;">
            <tr>
              <td style="border-bottom: 1px solid #eee; padding: 15px;">
                <strong>Email:</strong> ${email}
              </td>
            </tr>
            <tr>
              <td style="padding: 15px;">
                <strong>Signup Date:</strong> ${new Date().toLocaleDateString()}
              </td>
            </tr>
          </table>
          <p style="color: #666; line-height: 1.6;">
            Next steps:<br>
            1. Start browsing products<br>
            2. Create your wishlist<br>
            3. Complete your profile for personalized recommendations
          </p>
          <table cellpadding="10" style="margin: 30px 0;">
            <tr>
              <td align="center" bgcolor="#3498db" style="border-radius: 5px;">
                <a href="http://localhost:3000" style="color: white; text-decoration: none; display: block; padding: 12px 25px;">
                  Start Shopping Now!
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td bgcolor="#ffffff" style="padding: 20px 30px; text-align: center; font-size: 12px; color: #666;">
          Questions? Contact our support team at <a href="mailto:support@app.com" style="color: #3498db;">support@app.com</a>
        </td>
      </tr>
    </table>
  `
});
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');

        transporter.sendMail({
          to: req.body.email,
          from: '"Support Team" <support@app.com>',
          subject: 'Password Reset Request 🔒',
          html: `
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <tr>
                <td bgcolor="#ffffff" style="padding: 40px 30px; text-align: center;">
                  <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">ShoppingApp</h1>
                </td>
              </tr>
              <tr>
                <td bgcolor="#f8f9fa" style="padding: 40px 30px;">
                  <h2 style="color: #2c3e50; margin-top: 0;">Password Reset Request</h2>
                  <p style="color: #666; line-height: 1.6;">
                    Hi ${userName || 'there'},<br><br>
                    We received a request to reset your password for your ShoppingApp account. 
                    If you didn't make this request, you can safely ignore this email.
                  </p>
                  <table cellpadding="10" style="background: #ffffff; margin: 20px 0; border-radius: 8px;">
                    <tr>
                      <td style="padding: 25px; text-align: center;">
                        <a href="http://localhost:3000/reset/${token}" 
                           style="display: inline-block; padding: 15px 30px; 
                           background: #3498db; color: white; text-decoration: none; 
                           border-radius: 5px; font-weight: bold; margin: 20px 0;">
                          Reset Your Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #666; line-height: 1.6;">
                    This password reset link will expire in 1 hour. 
                    If you need a new link after that, please request another reset.
                  </p>
                  <p style="color: #666; line-height: 1.6;">
                    For security purposes, please don't share this link with anyone.
                  </p>
                </td>
              </tr>
              <tr>
                <td bgcolor="#ffffff" style="padding: 20px 30px; text-align: center; font-size: 12px; color: #666;">
                  Questions? Reply to this email or contact our support team at <a href="mailto:support@app.com" style="color: #3498db;">support@app.com</a>
                </td>
              </tr>
            </table>
          `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

