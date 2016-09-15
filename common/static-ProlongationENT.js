var IMPERSONATE_COOKIE = 'CAS_TEST_IMPERSONATE';
if (m = document.cookie.match(new RegExp(IMPERSONATE_COOKIE + "=(\\w+)"))) {
    window.bandeau_ENT.uid = m[1];
}
if (parent == window) {
    document.write("<script src='https://ent-test.univ-paris1.fr/ProlongationENT/loader.js'></script>\n");
}
