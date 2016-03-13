function tour(force) {
  var mytour = new Tour({
    //duration: 6000,
    debug: true,
    orphan: true,
    steps: [
      {
        element: "#scratchsize",
        title: "Play locally",
        content: "Select a board size to play locally",
      },
      {
        element: "#login-button",
        title: "Online play",
        placement: "left",
        content: "Click here to register and login with your handle or login as guest",
      },
      {
        element: "#loadtps",
        title: "Load TPS",
        content: "Paste your TPS in 'Load TPS'"
      },
      {
        element: "#floating",
        title: "Notation area",
        content: "Shows current game notation, player names and options to draw/resign",
      },
      {
        element: "#notation-toggle-text",
        title: "Notation area",
        content: "Clicking here will collapse/display notation area"
      },
      {
        element: "#chat",
        title: "Chat area",
        placement: "left",
        content: "You can chat here when you're online"
      },
      {
        element: "#chat-toggle-button",
        title: "Chat area",
        placement: "left",
        content: "Clicking here will collapse/display chat area"
      },
      {
        element: "#creategame",
        title: "Create game",
        content: "Select a board size to look for an opponent on server"
      },
      {
        element: "#joingame",
        title: "Join game",
        content: "Select a game on server to join. The number indicates number of games advertised on server"
      },
      {
        element: "#watch",
        title: "Watch game",
        content: "Select a game to watch. The number indicates number of ongoing games"
      },
      {
        element: "#onlineplayers",
        title: "Online players",
        placement: "left",
        content: "The number indicates the number of online players"
      },
      {
        element: "#zoomcontrols",
        title: "Quick icons",
        placement: "top",
        autoscroll: false,
        content: "Buttons to zoom in/out, reverse board or take this tour again!"
      },
  ]});
  mytour.setCurrentStep(0);
  mytour.init(force);
  mytour.start(force);
}
