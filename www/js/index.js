if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
  $(document).on("deviceready", onDeviceReady);
} else {
  $(document).ready(function () {
    onDeviceReady();
  });
}

var db = window.openDatabase("iRating", "1.0", "iRating", 200000);

function onDeviceReady() {
  db.transaction((tx) => {
    let accountQuery =
      "CREATE TABLE IF NOT EXISTS Account(Id INTEGER PRIMARY KEY AUTOINCREMENT, Username TEXT NOT NULL, Password TEXT NOT NULL, Email TEXT NOT NULL, Phone INTEGER NOT NULL, Name TEXT NOT NULL )";
    let restaurantQuery =
      "CREATE TABLE IF NOT EXISTS Restaurant(Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, Type TEXT NOT NULL, City TEXT NOT NULL, District TEXT NOT NULL, Image TEXT NOT NULL )";
    let reportQuery =
      "CREATE TABLE IF NOT EXISTS Report(Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, Type TEXT NOT NULL, DateVisit TEXT NOT NULL, Average INTEGER NOT NULL, Service TEXT NOT NULL, Cleanliness TEXT NOT NULL, Food TEXT NOT NULL, Note TEXT NOT NULL, Account_Id INTEGER NOT NULL, Restaurant_Id INTEGER NOT NULL, Reporter_Name TEXT NOT NULL, FOREIGN KEY (Account_Id) REFERENCES Account(Id), FOREIGN KEY (Restaurant_Id) REFERENCES Restaurant(Id), FOREIGN KEY (Reporter_Name) REFERENCES Account(Name))";
    let noteQuery =
      "CREATE TABLE IF NOT EXISTS Note(Id INTEGER PRIMARY KEY AUTOINCREMENT, Content TEXT NOT NULL, Account_Id INTEGER NOT NULL, Report_Id INTEGER NOT NULL, FOREIGN KEY (Account_Id) REFERENCES Account(Id), FOREIGN KEY (Report_Id) REFERENCES Report(Id))";
    tx.executeSql(accountQuery, [], createSuccess, transError);
    tx.executeSql(restaurantQuery, [], createSuccess, transError);
    tx.executeSql(reportQuery, [], createSuccess, transError);
    tx.executeSql(noteQuery, [], createSuccess, transError);
  });
}
function createSuccess() {
  console.log("Create success!");
}
function transError(err) {
  alert("Error: " + err.code);
}
var storage = window.localStorage;
function insertSuccess(username, password) {
  db.transaction((tx) => {
    let query = "SELECT * FROM Account WHERE Username = ? AND Password = ?";
    tx.executeSql(
      query,
      [username, password],
      function (tx, result) {
        if (result.rows.length > 0) {
          storage.setItem("Id", result.rows.item(0).Id);
          storage.setItem("accName", result.rows.item(0).Name);
          window.location.href = "#home-page";
        } else alert("Invalid Username or Password!");
      },
      transError
    );
  });
}
$(document).on("pageshow", "#home-page", function () {
  $("#welcome").text(`Welcome ${storage.getItem("accName")},`);
});

$(document).on("submit", "#signup", signUp);
function signUp(event) {
  let username = $("#signup-username").val();
  let password = $("#signup-password").val();
  let email = $("#email").val();
  let phone = $("#phone").val();
  let name = $("#name").val();

  db.transaction((tx) => {
    let query =
      "INSERT INTO Account (Username, Password, Email, Phone, Name) VALUES (?, ?, ?, ?, ?)";
    tx.executeSql(
      query,
      [username, password, email, phone, name],
      insertSuccess(username, password),
      transError
    );
  });
  event.preventDefault();
}

$(document).on("submit", "#signin", signIn);
function signIn(event) {
  event.preventDefault();
  let username = $("#signin-username").val();
  let password = $("#signin-password").val();
  if (username !== "" && password !== "") {
    db.transaction((tx) => {
      let query = "SELECT * FROM Account WHERE Username = ? AND Password = ?";
      tx.executeSql(
        query,
        [username, password],
        function (tx, result) {
          if (result.rows.length > 0) {
            storage.setItem("Id", result.rows.item(0).Id);
            storage.setItem("accName", result.rows.item(0).Name);
            window.location.href = "#home-page";
          } else alert("Invalid Username or Password!");
        },
        function (err) {
          if (err) transError;
          alert("Invalid username or password!");
        }
      );
    });
  }
}

$(document).on("vclick", "#takeImage", takePicture);
function takePicture() {
  navigator.camera.getPicture(onSuccess, onFail, {
    quality: 50,
    destinationType: Camera.DestinationType.DATA_URL,
  });
  function onSuccess(imageData) {
    storage.setItem("img", imageData);
  }
  function onFail(message) {
    alert("Failed to take image because: " + message);
  }
}

$(document).on("submit", "#createRestaurant", createRestaurant);

function createRestaurant(event) {
  let name = $("#restaurant-name").val();
  let type = $("#restaurant-type").val();
  let city = $("#city").val();
  let district = $("#district").val();
  let image = storage.getItem("img");
  if (image == "" || image == undefined) {
    image = "./img/default.png";
  }

  db.transaction((tx) => {
    let query =
      "INSERT INTO Restaurant (Name, Type, City, District, Image) VALUES (?, ?, ?, ?, ?)";
    tx.executeSql(
      query,
      [name, type, city, district, image],
      function () {
        storage.setItem("img", "");
        getRestaurants();
      },
      transError
    );
  });
  event.preventDefault();
}
$(document).on("pageshow", "#restaurants-page", getRestaurants);
$(document).on("keypress", "#restaurant-search", searchRestaurants);
function getRestaurants() {
  $("#restaurant-name").val("");
  $("#restaurant-type").val("");
  $("#city").val("");
  $("#district").val("");

  db.transaction((tx) => {
    let query = "SELECT * FROM Restaurant";
    tx.executeSql(
      query,
      [],
      function (tx, result) {
        viewRestaurants(result.rows);
      },
      transError
    );
  });
}
function searchRestaurants() {
  let search = $("#restaurant-search").val();
  if (search === "") {
    getRestaurants();
  } else {
    db.transaction((tx) => {
      let query = `SELECT * FROM Restaurant WHERE Type LIKE ('%${search}%')`;
      tx.executeSql(
        query,
        [],
        function (tx, result) {
          if (result.rows.length > 0) {
            viewRestaurants(result.rows);
          }
        },
        transError
      );
    });
  }
}
function viewRestaurants(data) {
  $("#restaurants").empty();
  if (data.length > 0) {
    $.each(data, function (index, item) {
      $("#restaurants").append(`<div id='${item.Id}'></div>`);
      $(`#${item.Id}`).append(`<img id="${item.Id}image" />`);
      if (item.Image !== "./img/default.png") {
        $(`#${item.Id}image`).attr(
          "src",
          `data:image/jpeg;base64,${item.Image}`
        );
      } else {
        $(`#${item.Id}image`).attr("src", item.Image);
      }
      $(`#${item.Id}`).append(`<p>Restaurant: ${item.Name}</p>`);
      $(`#${item.Id}`).append(`<p>Type: ${item.Type}</p>`);
      $(`#${item.Id}`).append(`<p>City: ${item.City}</p>`);
      $(`#${item.Id}`).append(`<p>District: ${item.District}</p>`);
      $(`#${item.Id}`).append(`<button id="${item.Id}rate">Rate</button>`);
      $(`#${item.Id}`).append(`<button id="${item.Id}delete">Delete</button>`);
      $(document).on("vclick", `#${item.Id}rate`, function () {
        handleClickRes(item.Id, item.Name, item.Type);
      });
      $(document).on("vclick", `#${item.Id}delete`, function () {
        handleDelete(item.Id);
      });
    });
  } else {
    $("#restaurants").append(`<p>There is no restaurant yet!</p>`);
  }
}
$(document).on("vclick", "#back", function () {
  window.location.href = "#rating-page";
});
function handleDelete(Id) {
  db.transaction((tx) => {
    let query = "DELETE FROM Restaurant WHERE Id = ?";
    tx.executeSql(query, [Id], getRestaurants, transError);
  });
}
function handleClickRes(Id, name, type) {
  storage.setItem("resId", Id);
  storage.setItem("name", name);
  storage.setItem("type", type);

  window.location.href = "#rating-page";
}
$(document).on("pageshow", "#rating-page", setRating);
function setRating() {
  $("#restaurant-report").val(storage.getItem("name"));
  $("#report-type").val(storage.getItem("type")).change();
  $("#reportername").val(storage.getItem("accName"));

  $("#rating-service-star")
    .rateYo()
    .on("rateyo.change", function (e, data) {
      $("#rating-service-point").text(data.rating);
    });

  $("#rating-cleanliness-star")
    .rateYo()
    .on("rateyo.change", function (e, data) {
      $("#rating-cleanliness-point").text(data.rating);
    });

  $("#rating-food-star")
    .rateYo()
    .on("rateyo.change", function (e, data) {
      $("#rating-food-point").text(data.rating);
    });
}
$(document).on("vclick", "#popupa", previewReport);
function previewReport() {
  let name = $("#restaurant-report").val();
  let type = $("#report-type").val();
  let date = $("#date").val();
  let price = $("#price").val();
  let note = $("#note").val();
  let service = $("#rating-service-point").text();
  let cleanliness = $("#rating-cleanliness-point").text();
  let food = $("#rating-food-point").text();
  let reporter = $("#reportername").val();
  $("#prename").text(`Restaurant: ${name}`);
  $("#pretype").text(`Type: ${type}`);
  $("#predate").text(`Date: ${date}`);
  $("#preprice").text(`Price: ${price}`);
  $("#prenote").text(`Note: ${note}`);
  $("#preservice").text(`Service: ${service}`);
  $("#precleanliness").text(`Cleanliness: ${cleanliness}`);
  $("#prefood").text(`Food: ${food}`);
  $("#prereporter").text(`Reporter: ${reporter}`);
}
$(document).on("vclick", "#report", saveReport);
function saveReport(event) {
  event.preventDefault();

  let name = $("#restaurant-report").val();
  let type = $("#report-type").val();
  let date = $("#date").val();
  let price = $("#price").val();
  let note = $("#note").val();
  let service = $("#rating-service-point").text();
  let cleanliness = $("#rating-cleanliness-point").text();
  let food = $("#rating-food-point").text();
  let reporter = $("#reportername").val();
  let account_Id = storage.getItem("Id");
  let restaurant_Id = storage.getItem("resId");
  if (
    name == "" ||
    $("#report-type option:selected").text() == "Restaurant's type ..." ||
    date == "" ||
    price == "" ||
    service == "0.0" ||
    cleanliness == "0.0" ||
    food == "0.0" ||
    reporter == ""
  ) {
    window.location.href = "#rating-page";
    $("#err").text("Please enter all the field required").css("color", "red");
  } else {
    $("#err").text("");
    db.transaction((tx) => {
      let query =
        "INSERT INTO Report (Name, Type, DateVisit, Average, Service, Cleanliness, Food, Note, Account_Id,  Restaurant_Id, Reporter_Name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      tx.executeSql(
        query,
        [
          name,
          type,
          date,
          price,
          service,
          cleanliness,
          food,
          note,
          account_Id,
          restaurant_Id,
          reporter,
        ],
        function () {
          $("#restaurant-report").val("");
          $("#report-type").prop("selected", false).trigger("change");
          $("#date").val("");
          $("#price").val("");
          $("#note").val("");
          $("#rating-service-star").rateYo({
            rating: 0,
          });
          $("#rating-cleanliness-star").rateYo({
            rating: 0,
          });
          $("#rating-food-star").rateYo({
            rating: 0,
          });
          $("#rating-service-point").text("");
          $("#rating-cleanliness-point").text("");
          $("#rating-food-point").text("");
          $("#reportername").val("");
          window.location.href = "#ratingview-page";
        },
        transError
      );
    });
  }
}
function handleDeleteReport(Id) {
  db.transaction((tx) => {
    let query = "DELETE FROM Report WHERE Id = ?";
    tx.executeSql(query, [Id], getReport, transError);
  });
}
function getReport() {
  $("#reportview").empty();
  db.transaction((tx) => {
    let query = "SELECT * FROM Report";
    tx.executeSql(
      query,
      [],
      function (tx, result) {
        if (result.rows.length > 0) {
          viewReport(result.rows);
        } else {
          $("#reportview").empty();
          $("#reportview").append("<p>There is no report yet!</p>");
        }
      },
      transError
    );
  });
}
$(document).on("pageshow", "#ratingview-page", getReport);
function viewReport(data) {
  $("#reportview").empty();
  if (data.length > 0) {
    $.each(data, function (index, item) {
      let count = (
        (parseFloat(item.Service) +
          parseFloat(item.Cleanliness) +
          parseFloat(item.Food)) /
        3
      ).toFixed(1);
      $("#reportview").append(
        `<div data-role="collapsible" data-collapsed="true" data-collapsed-icon="carat-d" data-expanded-icon="carat-u" data-content-theme="false" id="${
          item.Id
        }report" class="${item.Name.toLowerCase()}"
        ></div>`
      );
      $(`#${item.Id}report`).append(`<h4>${item.Name}</h4>`);
      $(`#${item.Id}report`).append(
        `<button id="${item.Id}del">Delete</button>`
      );

      $(document).on("vclick", `#${item.Id}del`, function () {
        handleDeleteReport(item.Id);
      });
      $(`#${item.Id}report`).append(
        `<div id="${item.Id}wrapper" class="wrapper"></div>`
      );
      $(`#${item.Id}wrapper`).append(
        `<div id="${item.Id}average" class="average"></div>`
      );
      $(`#${item.Id}average`).append(`<p>Average: ${count}</p>`);
      $(`#${item.Id}average`).append(`<div id="${item.Id}service"></div>`);
      $(`#${item.Id}average`).append(`<div id="${item.Id}cleanliness"></div>`);
      $(`#${item.Id}average`).append(`<div id="${item.Id}food"></div>`);
      $(`#${item.Id}wrapper`).append(`<p>Type: ${item.Type}</p>`);
      $(`#${item.Id}wrapper`).append(
        `<p>Visited: ${item.DateVisit}</p><p>About ${item.Average}$/person</p>`
      );
      $(`#${item.Id}wrapper`).append(`<p>Note: ${item.Note}</p>`);
      $(`#${item.Id}wrapper`).append(`<p>From: ${item.Reporter_Name}</p>`);
      $(`#${item.Id}wrapper`).append(`<div id="${item.Id}comment"></div>`);
      $(`#${item.Id}wrapper`).append(
        `<div class="notearea"><input type="text" id="${item.Id}inp" /><button id="${item.Id}butn">Add note</button></div>`
      );

      $(document).on("vclick", `#${item.Id}butn`, function () {
        return addComment(item.Id);
      });

      $(`#${item.Id}service`).rateYo({
        rating: item.Service,
        readOnly: true,
      });
      $(`#${item.Id}service`).append(`<span>${item.Service}</span>`);
      $(`#${item.Id}cleanliness`).rateYo({
        rating: item.Cleanliness,
        readOnly: true,
      });
      $(`#${item.Id}cleanliness`).append(`<span>${item.Cleanliness}</span>`);
      $(`#${item.Id}food`).rateYo({
        rating: item.Food,
        readOnly: true,
      });
      $(`#${item.Id}food`).append(`<span>${item.Food}</span>`);
      $("#reportview").collapsibleset("refresh");
    });
  }
}
$(document).on("keypress", "#ratingsearch-inp", searchReport);

function searchReport() {
  let search = $("#ratingsearch-inp").val();

  if (search === "") {
    getReport();
  } else {
    db.transaction((tx) => {
      let query = `SELECT * FROM Report WHERE Type LIKE ('%${search}%')`;
      tx.executeSql(
        query,
        [],
        function (tx, result) {
          if (result.rows.length > 0) {
            viewReport(result.rows);
            viewComment();
          }
        },
        transError
      );
    });
  }
}
function addComment(reportId) {
  let accId = storage.getItem("Id");
  let content = $(`#${reportId}inp`).val();

  db.transaction((tx) => {
    let query =
      "INSERT INTO Note (Content, Account_Id, Report_Id) VALUES(?, ?, ?)";
    tx.executeSql(query, [content, accId, reportId], viewComment, transError);
  });
}
$(document).on("pageshow", "#ratingview-page", viewComment);
function viewComment() {
  db.transaction((tx) => {
    let query = "SELECT * FROM Note";
    tx.executeSql(
      query,
      [],
      function (tx, result) {
        if (result.rows.length > 0) {
          $.each(result.rows, function (index, item) {
            $(`#${item.Report_Id}comment`).empty();
            let reporterName = "";
            tx.executeSql(
              "SELECT * FROM Account WHERE Id = ?",
              [item.Account_Id],
              function (tx, result) {
                reporterName = result.rows.item(0).Name;
                $(`#${item.Report_Id}comment`).append(
                  `<h3>${reporterName}</h3><p>${item.Content}</p>`
                );
              },
              transError
            );
          });
        }
      },
      transError
    );
  });
}
