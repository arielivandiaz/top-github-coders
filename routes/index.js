var express = require("express");
var router = express.Router();
const access = require("../config/access.json");
const fetch = require("node-fetch");
const { createOAuthAppAuth } = require("@octokit/auth-oauth-app");

const auth = createOAuthAppAuth({
  clientId: access.clientId,
  clientSecret: access.clientSecret,
});

let getDate = () => {
  var todayTime = new Date();
  var month = String(todayTime.getMonth() + 1);
  var day = String(todayTime.getDate());
  var year = String(todayTime.getFullYear());

  if (day.length < 2) day = "0" + day;
  if (month.length < 2) month = "0" + month;

  return year - 1 + "-" + month + "-" + day;
};

compareScore = (a, b) => {
  let comparison = 0;
  if (a.score > b.score) {
    comparison = -1;
  } else if (a.score < b.score) {
    comparison = 1;
  }
  return comparison;
};

var masterRank = [];

var maxFollowers = 1;
var maxStars = 1;
var maxCommits = 1;
var maxRepos = 1;
var maxPRS = 1;

var per_page = 100;
var url = {
  getUsers:
    "https://api.github.com/search/users?q=location:argentina%20followers:%3E10%20repos:%3E10%20type:user&per_page=" +
    per_page +
    "&page=#1&sort=followers&order=desc",
};

/***************************** getUsers ********************************/
let getUsers = async (token) => {
  let promise = new Promise((resolve, reject) => {
    fetch(url.getUsers, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        authorization: token,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        resolve(json);
      });
  });
  return await promise;
};

/***************************** getUserData ********************************/
let getUserData = async (user_url, token) => {
  let promise = new Promise((resolve, reject) => {
    fetch(user_url, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        authorization: token,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        resolve(json);
      });
  });
  return await promise;
};

/***************************** getRateLimit ********************************/
let getRateLimit = (token) => {
  return new Promise((resolve, reject) => {
    fetch("https://api.github.com/rate_limit", {
      method: "get",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        authorization: token,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        resolve(json);
      });
  });
};

/***************************** getStars ********************************/
let getStars = async (login, token) => {
  let promise = new Promise((resolve, reject) => {
    //console.log("https://api.github.com/search/repositories?q=user:" + login);
    fetch("https://api.github.com/search/repositories?q=user:" + login, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        authorization: token,
      },
    })
      .then((res) => res.json())
      .then((json) => resolve(json.total_count));
  });
  return await promise;
};

/***************************** getCommits********************************/
let getCommits = async (login, token) => {
  let promise = new Promise((resolve, reject) => {
    var uri =
      "https://api.github.com/search/commits?q=author:" +
      login +
      " committer-date:>" +
      getDate();

    console.log(uri);
    fetch(uri, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.cloak-preview",
        authorization: token,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        resolve(json.total_count);
      });
  });
  return await promise;
};

/************************************************************** 
TODO: Visitar todos los repos de un usuario, contarlos, ver las tecnologias y detertar si fork : false, sino repos -=1;
tambien para checkear las stars : = parseInt(repo["stargazers_count"]);
/**************************************************************** */
// Get Repos
/*
fetch('https://api.github.com/users/arielivandiaz/repos?per_page=500&page=1')
  .then(res => res.json())
  .then(json => {
    var size = 0;
    //console.log(json);


    json.forEach(repo => {
      if (repo.fork)
        console.log("forked : ", repo.name);
      else
        console.log(repo.name);
    });
  }
  );

*/

/**************************************************************** */
// #Todo: Get Techology of a repo

//{ C: 3944061, 'C++': 85852, Assembly: 13350 }
// Hay que crear un valor por cada key y el numero es la cantidad de codigo usado
/*
fetch('https://api.github.com/repos/PASTR4NA/Contamicrap_SinTimer/languages')
.then(res => res.json())
.then(json => {
  var size = 0;
  console.log(json);
  /*
  json.forEach(repo => {

});
}
);
*/

/****************************** *********************************/

let singleUser = async (user, token) => {
  var uri = "https://api.github.com/users/" + user;
  //console.log(uri);
  await new Promise((r) => setTimeout(r, 2000));
  var userData = await getUserData(uri, token);
  await new Promise((r) => setTimeout(r, 2000));
  var stars = await getStars(userData.login, token);
  await new Promise((r) => setTimeout(r, 2000));
  var commits = await getCommits(userData.login, token);

  console.log(userData);

  var profile = {
    login: userData.login,
    id: userData.id,
    img: userData.avatar_url,
    profileUrl: userData.html_url,
    url: userData.url,
    location: userData.location,
    company: userData.company,
    name: userData.name,
    repos_url: userData.repos_url,
    public_repos: userData.public_repos,
    followers: userData.followers,
    stars: stars,
    commits: commits,
    prs: 0,
    score: 0,
  };
  //console.log(profile);
  return profile;
  //resolve(profile);
};

/* Example Output - SingleUser
{
  login: 'arielivandiaz',
  id: 19569934,
  img: 'https://avatars2.githubusercontent.com/u/19569934?v=4',
  profileUrl: 'https://github.com/arielivandiaz',
  url: 'https://api.github.com/users/arielivandiaz',
  location: 'Argentina',
  company: '@lagunasoftware ',
  name: 'Ariel Ivan Diaz',
  repos_url: 'https://api.github.com/users/arielivandiaz/repos',
  public_repos: 48,
  followers: 8,
  stars: 29,
  commits: 59,
  prs: 0
}


*/
/* Example - Get data of a single user
auth({
  type: "oauth-app",
})
  .then((response) => {
    var token = response.headers.authorization;
    singleUser(token,"arielivandiaz").then((profile)=> {
      console.log("profile");
    }).catch((err)=>{
      console.log(err);
    })
  })
  .catch((err) => {
    console.log(err);
  });
*/

//Get Rank

let getToken = async () => {
  let promise = new Promise((resolve, reject) => {
    auth({
      type: "oauth-app",
    })
      .then((response) => {
        var token = response.headers.authorization;
        resolve(token);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
  return await promise;
};

let main = async () => {
  var token = await getToken();
  console.log(token);
  var users = await getUsers(token);

  for (var i = 0; i < users.items.length; i++) {
    console.log(users.items[i].login);
    var newUser = await singleUser(users.items[i].login, token);
    masterRank.push(newUser);
  }

  maxFollowers = 1;
  maxStars = 1;
  maxCommits = 1;
  maxRepos = 1;
  maxPRS = 1;

  console.log("*******************************************");


  masterRank.forEach((user) => {

    if (user.public_repos > maxRepos) maxRepos = user.public_repos;
    if (user.followers > maxFollowers) maxFollowers = user.followers;
    if (user.stars > maxStars) maxStars = user.stars;
    if (user.commits > maxCommits) maxCommits = user.commits;
    if (user.prs > maxPRS) maxPRS = user.prs;
  });

  console.log("maxFollowers", maxFollowers);
  console.log("maxStars", maxStars);
  console.log("maxCommits", maxCommits);
  console.log("maxRepos", maxRepos);
  console.log("maxPRS", maxPRS);

  masterRank.forEach((user) => {
    user.score =
      (parseInt(user.public_repos) / maxRepos +
        parseInt(user.followers) / maxFollowers +
        parseInt(user.stars) / maxStars +
        parseInt(user.commits) / maxCommits) /
      4;
  });

  masterRank.sort(compareScore);
};
main();

/*



let main = async () => {
  let promise = new Promise((resolve, reject) => {
    masterRank = [];
    masterRank.length = 0;


    var token =  await getToken();
    //var users = await getUsers(token);
    /*

            users.items.forEach((user) => {
              // console.log(user.login);
              
              
              var newUser = await singleUser(user.login, token);
              masterRank.push(newUser);

            });


            getRateLimit(token)
                  .then((rate) => {
                    console.log(rate.rate);

      
          })
          .catch((err) => {
            console.log(err);
            reject(err);

  });
  return await promise;
};


*/
/*



main()
  .then(() => {
    maxFollowers = 1;
    maxStars = 1;
    maxCommits = 1;
    maxRepos = 1;
    maxPRS = 1;

    masterRank.forEach((user) => {
      if (user.public_repos > maxRepos) maxRepos = user.public_repos;
      if (user.followers > maxFollowers) maxFollowers = user.followers;
      if (user.stars > maxStars) maxStars = user.stars;
      if (user.commits > maxCommits) maxCommits = user.commits;
      if (user.prs > maxPRS) maxPRS = user.prs;
    });

    console.log("maxFollowers", maxFollowers);
    console.log("maxStars", maxStars);
    console.log("maxCommits", maxCommits);
    console.log("maxRepos", maxRepos);
    console.log("maxPRS", maxPRS);

    masterRank.forEach((user) => {
      user.score =
        (parseInt(user.public_repos) / maxRepos +
          parseInt(user.followers) / maxFollowers +
          parseInt(user.stars) / maxStars +
          parseInt(user.commits) / maxCommits) /
        4;
    });

    masterRank.sort(compareScore);
  })
  .catch((err) => {
    console.log(err);
  });*/

//******************************************************* */
/*
Bbtain the ranking, first approximation = gives incomplete results.
*/
/*
auth({
  type: "oauth-app",
})
  .then((response) => {
    var token = response.headers.authorization;
    setUsers(token)
      .then((rank) => {
        setStars(rank, token)
          .then((rank) => {
            setCommits(rank, token)
              .then((rank) => {
                setPRs(rank, token)
                  .then((rank) => {
                    //console.log(rank);
                    masterRank = rank;
                    console.log(masterRank);
                    console.log("****ranked*****");

                    getRateLimit(token)
                      .then((rate) => {                 
                        console.log(rate.rate);
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  })
  .catch((err) => {
    console.log(err);
  });
*/

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    rank: masterRank,
    maxValues: {
      maxFollowers,
      maxStars,
      maxCommits,
      maxRepos,
      maxPRS,
    },
  });
});

module.exports = router;
