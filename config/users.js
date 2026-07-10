// Centralized hardcoded user list.
// role "admin"  -> can see/manage everything, from every user.
// role "user"   -> shares a common pool with every other "user" role account
//                  (e.g. user1's uploads are visible to user2, and vice versa),
//                  but cannot see admin's uploads.
const getUsers = () => [
  {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    role: "admin",
  },
  {
    username: process.env.USER1_USERNAME,
    password: process.env.USER1_PASSWORD,
    role: "user",
  },
  {
    username: process.env.USER2_USERNAME,
    password: process.env.USER2_PASSWORD,
    role: "user",
  },
];

// All usernames that belong to the shared "user" pool
const getPeerUsernames = () =>
  getUsers()
    .filter((u) => u.role === "user")
    .map((u) => u.username);

module.exports = { getUsers, getPeerUsernames };