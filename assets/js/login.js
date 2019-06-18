/* globals jQuery, QiscusSDK */
jQuery(function () {
  var isLoggedIn = window.sessionStorage.getItem('sdk-sample-app---is-loggedin');
  if (isLoggedIn && Boolean(isLoggedIn) === true) {
    window.location.href = './';
  }
  QiscusSDK.core.init({
    AppId: window.SDK_APP_ID,
    options: {
      loginSuccessCallback: function (data) {
        console.log('loginSuccessCallback', data);
        var userData = {
          userId: "user3_sample_call@example.com",
          secret: "123",
          username: "User 3 Sample Call",
          avatarURL: ""
        };
        window.sessionStorage.setItem('sdk-sample-app---is-loggedin', true);
        window.sessionStorage.setItem('sdk-sample-app---user-data', JSON.stringify(userData));
        window.location.href = './';
      }
    }
  });
  QiscusSDK.core.setUser(
    /* userId */ "user3_sample_call@example.com",
    /* password */ "123",
    /* displayName */ "User 3 Sample Call",
    /* avatarURL */ ""
  );
});
