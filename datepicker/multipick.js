$(document).ready(function(){
    
    // lookup array of date objects for given date
    function includesDate(arr, needle) {
      for(var i=0; i < arr.length; i++){
        if( arr[i].toString() == needle.toString() ){
          return true;
        }
      }
      return false;
    }

    // eeeh .. no need for it, will remove later
    // http://stackoverflow.com/a/3067896/1660185
    Date.prototype.yyyymmdd = function() {
        var mm = this.getMonth() + 1; // getMonth() is zero-based
        var dd = this.getDate();

        return [this.getFullYear(), !mm[1] && '0', mm, !dd[1] && '0', dd].join(''); // padding
    };


    // returns array of dates between two given dates, including these two
    function getDatesRange(date1, date2) {
        if ('string' == typeof date1) {
            date1 = new Date(date1);
        }

        if ('string' == typeof date2) {
            date1 = new Date(date2);
        }

        var fromD, toD;
        if (date1 < date2) {
            fromD = date1;
            toD = date2;
        } else {
            fromD = date2;
            toD = date1;
        }

        var dateArray = [];
        var currentDate = fromD;
        while (currentDate <= toD) {
             dateArray.push( new Date(currentDate) );
             // This works even for the last day of a month (or year), because the JavaScript date object is smart about rollover
             currentDate = currentDate.setDate(currentDate.getDate() + 1);
             // recreate date object, as now currentdate is timestamp
             currentDate = new Date(currentDate);
        }

        return dateArray;
    }

    // Pass either element or selector.
    function MyDatepicker(el) {
        if ('string' == typeof el) {
            el = $(el);
        }

        this.$el = el;

        // remove it
        window.eel = el;

        this.isShift = false;
        this.lastClick = {};
        this.state = [];

        this.init();
    }

    MyDatepicker.prototype.init = function(){
        var self = this;

        $(document).keydown(function (e) {
            if (e.keyCode == 16) {
                self.isShift = true;
            }
        });

        $(document).keyup(function (e) {
            if (e.keyCode == 16) {
                self.isShift = false;
            }
        });

        this.$el.multiDatesPicker({
            onSelect: function(date, dateObj){
                var state = $(this).multiDatesPicker('getDates');
                var i;
                for (i = 0; i < state.length; i++) {
                    state[i] = new Date(state[i]);
                }
                date = new Date(date);
                
                var dateAdded = false;
                if (includesDate(state, date)) {
                    dateAdded = true;
                }

                if (self.lastClick.added && self.isShift && self.lastClick.date.toString() != date.toString()) {
                    var range = getDatesRange(self.lastClick.date, date);
                    
                    for (i = 0; i < range.length; i++) {
                        if (!includesDate(state, range[i])) {
                            self.$el.multiDatesPicker('addDates', [range[i]]);

                        }
                    }

                }
                

                self.lastClick.date = date;
                self.lastClick.added = dateAdded;

            }
            
        });
    }

    MyDatepicker.prototype.getDates = function() {
        return this.$el.multiDatesPicker('getDates');
    }

    MyDatepicker.prototype.getEl = function() {
        return this.$el;
    }    



    new MyDatepicker('#datepicker');

});