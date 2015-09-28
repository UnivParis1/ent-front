var IMPERSONATE_COOKIE = 'CAS_TEST_IMPERSONATE';
if (m = document.cookie.match(new RegExp(IMPERSONATE_COOKIE + "=(\\w+)"))) {
    window.bandeau_ENT.uid = m[1];
}
document.write("<script src='https://esup-test.univ-paris1.fr/ProlongationENT/loader.js'></script>\n");
