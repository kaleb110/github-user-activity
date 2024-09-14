import readline from "readline";
import https from "https";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const fetchData = async (username) => {
  try {
    const url = `https://api.github.com/users/${username}/events`;

    https
      .get(url, { headers: { "User-Agent": "node.js" } }, (res) => {
        const { statusCode } = res;
        let error = "";
        if (statusCode !== 200) {
          error = new Error(`Error fetching data: ${statusCode}`);
        }

        if (error) {
          console.error(error.message);
          // Consume response data to free up memory
          res.resume();
          return;
        }

        let data = "";

        // Collect the data chunks
        res.on("data", (chunk) => {
          data += chunk;
        });

        // When the response ends, process the data
        res.on("end", () => {
          try {
            const result = JSON.parse(data);

            // Ensure result is an array and has at least one event
            if (Array.isArray(result) && result.length > 0) {
              let res = result.slice(0, 7)
              res.forEach((event) => {
                switch (event.type) {
                  case "PushEvent":
                    PushEvent(event);
                    break;
                  case "WatchEvent":
                    WatchEvent(event);
                    break;
                  case "CreateEvent":
                    CreateEvent(event);
                    break;
                  default:
                    console.log("Event type not handled:", event.type);
                }
              });
            } else {
              console.log("No events found or invalid username");
            }
          } catch (e) {
            console.error("Error parsing JSON:", e.message);
          }
        });
      })
      .on("error", (e) => {
        console.log("Error fetching data:", e.message);
      });
  } catch (error) {
    console.log(`Error occurred: ${error.message}`);
  }
};

const PushEvent = (event) => {
  const commits = event.payload.commits;
  const repo = event.repo.name;
  if (Array.isArray(commits) && commits.length > 0) {
    console.log(`Pushed ${commits.length} commit(s) to ${repo}`);
  } else {
    console.log(`No commits found in this PushEvent for repository: ${repo}`);
  }
};

const WatchEvent = (event) => {
  const repo = event.repo.name;
  console.log(`Starred repository: ${repo}`);
};

const CreateEvent = (event) => {
  const { ref, ref_type } = event.payload;
  const { name } = event.repo;
  if (ref_type === "repository") {
    console.log(`Created repository: ${name}`);
  } else if (ref_type === "branch") {
    console.log(`Created branch '${ref}' in repository: ${name}`);
  } else {
    console.log(
      `Created unknown type '${ref_type}' in repository: ${name}`
    );
  }
};

rl.question("github-activity >> ", async (username) => {
  try {
    await fetchData(username);
  } catch (error) {
    console.log(`Error occurred: ${error.message}`);
  }
  rl.close();
});
