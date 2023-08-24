# slackStatus (WIP)

## Description

The slackStatus is a Visual Studio Code (VSCode) extension designed to enhance your coding workflow by providing real-time monitoring of your coding activity and enabling automatic status updates on Slack. With this extension, you can stay accountable and keep your team informed about your progress without any extra effort.

### Key Features (WIP)

* Keep track of what documents you have been working on.
  * Lines per document
  * Characters per document
  * TODO: Time based threshold (ie: last 24 hours)
  * TODO: Pull from VSCode configuration

* Slack Integration
  * Seamlessly integrates with your Slack workspace. It allows you to configure the Slack channel or user where you want to share your coding progress.
  * Set a threshold for when to send a slack message (ie: every N minutes)
    * (TODO) Add a configurable property for this

* Privacy and Security
  * It does not access or store your code or any sensitive information. The extension focuses solely on tracking coding activity to generate meaningful updates.

* Unobtrusive Design
  * Pulling from the design of other popular [VSCode extensions](https://github.com/iCrawl/discord-vscode)

### How to Use

#### Install the Extension (Not available yet)

Search for "slackStatus" in the VSCode extension marketplace and install it.

#### Configure Slack Settings

In the extension's settings, provide your Slack workspace information, including the channel or user you want to send status updates to.

#### Set Thresholds

Customize your coding thresholds to suit your coding style and pace.

#### Start Coding

As you write or modify code in VSCode, slackStatus will monitor your activity in the background.

#### Automated Updates

When you cross the set threshold, slackStatus will automatically send a status update to Slack, keeping your team informed about your progress.

### How to Develop

```bash
# Clone the repository
git clone <git-repository>
```

```bash
# Open in VSCode
code slackStatus
```

```bash
# Install dependencies
npm install
```

F5 builds the application and runs it in another VSCode application