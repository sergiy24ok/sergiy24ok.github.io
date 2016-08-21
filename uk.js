var redirect = (function () {
    /* This implements the actual redirection. */
    var redirectBrowser = function () {
        var uri = "http://www.example.com/";
        window.location = uri;
    };
 
    var onSuccess = function (geoipResponse) {
        /* There's no guarantee that a successful response object
         * has any particular property, so we need to code defensively. */
        if (!geoipResponse.country.iso_code) {
            console.log('Maxmind redirect script: no country code ...')
            return;
        }
 
        /* ISO country codes are in upper case. */
        var code = geoipResponse.country.iso_code.toLowerCase();

        if ('gb' !== code) {
            redirectBrowser();
        }
        
    };
 
    /* We don't really care what the error is, we'll send them
     * to the default site. */
    var onError = function (error) {
        console.log('Maxmind redirect script: Error occured ...')
    };
 
    return function () {
        geoip2.country( onSuccess, onError );
    };
}());
 
redirect();