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

/* Resources */
// Project Peru: https://github.com/joelibaceta/top-coders-peru
// Advanced Serch
//https://github.com/search/advanced
// ex: stars:>1 location:Argentina followers:>5 repos:>1

const test_mode = 0;

var masterRank = [];

var maxFollowers = 1;
var maxStars = 1;
var maxCommits = 1;
var maxRepos = 1;
var maxPRS = 1;

/*
if (test_mode)
  url = {
    getUsers: "http://localhost:4747/getUsers.txt",
  };
  */
var url = {
  getUsers:
    "https://api.github.com/search/users?q=location:argentina%20followers:%3E10%20repos:%3E10%20type:user&per_page=5&page=#1&sort=followers&order=desc",
};

/***************************** getUsers ********************************/
let getUsers = (token) => {
  return new Promise((resolve, reject) => {
    fetch(url.getUsers, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        authorization: token,
      },
    })
      .then((res) => res.json())
      .then((json) => resolve(json));
  });
};

/***************************** getUserData ********************************/
let getUserData = (user_url, token) => {
  return new Promise((resolve, reject) => {
    fetch(user_url, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        authorization: token,
      },
    })
      .then((res) => res.json())
      .then((json) => resolve(json));
  });
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
      .then((json) => resolve(json));
  });
};

/***************************** getStars ********************************/
let getStars = (login, token) => {
  return new Promise((resolve, reject) => {
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
};

/***************************** setStars ********************************/

let setStars = (rank, token) => {
  return new Promise((resolve, reject) => {
    let promises = [];

    rank.forEach((user) => {
      promises.push(getStars(user.login, token));
    });

    Promise.all(promises)
      .then((stars) => {
        for (var i = 0; i < rank.length; i++) {
          rank[i].stars = stars[i];
        }
        resolve(rank);
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

/***************************** getPRs ********************************/
let getPRs = (login, token) => {
  return new Promise((resolve, reject) => {
    //console.log("https://api.github.com/search/repositories?q=user:" + login);

    var uri =
      "https://api.github.com/search/issues?q=involves:" +
      login +
      "%20type:pr%20is:merged%20is:public%20not%20 " +
      login +
      "%20%20&per_page=1";
    //console.log(uri);
    fetch(uri, {
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
};

/***************************** setPRs ********************************/

let setPRs = (rank, token) => {
  return new Promise((resolve, reject) => {
    let promises = [];

    rank.forEach((user) => {
      promises.push(getPRs(user.login, token));
    });

    Promise.all(promises)
      .then((prs) => {
        for (var i = 0; i < rank.length; i++) {
          rank[i].prs = prs[i];
        }
        resolve(rank);
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

/***************************** getCommits********************************/
let getCommits = (login, token) => {
  return new Promise((resolve, reject) => {
    var uri =
      "https://api.github.com/search/commits?q=author:" +
      login +
      " committer-date:>" +
      getDate();

    //console.log(uri);
    fetch(uri, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.cloak-preview+json",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        resolve(json.total_count);
      });
  });
};

/***************************** setCommits ********************************/

let setCommits = (rank, token) => {
  return new Promise((resolve, reject) => {
    let promises = [];

    rank.forEach((user) => {
      promises.push(getCommits(user.login, token));
    });

    Promise.all(promises)
      .then((commits) => {
        for (var i = 0; i < rank.length; i++) {
          rank[i].commits = commits[i];
        }
        resolve(rank);
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

/***************************** main1 - setUsers ********************************/
let setUsers = (token) => {
  return new Promise((resolve, reject) => {
    getUsers(token)
      .then((users) => {
        let promises = [];

        users.items.forEach((user) => {
          promises.push(getUserData(user.url, token));
        });

        Promise.all(promises)
          .then((userData) => {
            var rankMaster = [];

            for (var i = 0; i < userData.length; i++) {
              var obj = {};

              var userObject = {
                login: userData[i].login,
                id: userData[i].id,
                img: userData[i].avatar_url,
                profileUrl: userData[i].html_url,
                url: userData[i].url,
                location: userData[i].location,
                company: userData[i].company,
                name: userData[i].name,
                repos_url: userData[i].repos_url,
                public_repos: userData[i].public_repos,
                followers: userData[i].followers,
                stars: 0,
                commits: 0,
                prs: 0,
              };

              rankMaster.push(userObject);
            }
            resolve(rankMaster);
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  });
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

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send(masterRank);
});

/*

/****************************** *********************************/

let singleUser = (user, token) => {
  return new Promise((resolve, reject) => {
    var uri = "https://api.github.com/users/" + user;
    //console.log(uri);
    getUserData(uri, token)
      .then((userData) => {
        getStars(userData.login, token)
          .then((stars) => {
            getCommits(userData.login, token)
              .then((commits) => {
                getPRs(userData.login, token)
                  .then((prs) => {
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
                      prs: prs,
                      score: 0,
                    };
                    //console.log(profile);
                    masterRank.push(profile);
                    resolve(profile);
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
        resolve();
      })
      .catch((err) => {
        console.log(err);
      });
  });
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

let main = () => {
  return new Promise((resolve, reject) => {
    masterRank = [];
    masterRank.length = 0;
    auth({
      type: "oauth-app",
    })
      .then((response) => {
        var token = response.headers.authorization;
        getUsers(token)
          .then((users) => {
            let promises = [];
            //console.log(users);

            users.items.forEach((user) => {
              // console.log(user.login);
              promises.push(singleUser(user.login, token));
            });

            Promise.all(promises)
              .then((rankData) => {
                getRateLimit(token)
                  .then((rate) => {
                    console.log(rate.rate);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
                resolve(rankData);
              })
              .catch((err) => {
                console.log(err);
                reject(err);
              });
          })
          .catch((err) => {
            console.log(err);
            reject(err);
          });
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};

main()
  .then(() => {
    setTimeout(function () {
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
          (user.public_repos / maxRepos +
            user.followers / maxFollowers +
            user.stars / maxStars +
            user.commits / maxCommits) /
          4;
      });
    }, 10000);
  })
  .catch((err) => {
    console.log(err);
  });

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

module.exports = router;
