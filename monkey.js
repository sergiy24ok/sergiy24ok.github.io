function createMetadata() {
    var exercise = {
        lines: [
        {
            words: ['100', 'monkeys', 'share', '100', 'bananas', '.'],
            questions: [
                { text: 'monkeys', correctAnswers: [['100']], icon: 'monkeys.svg' },
                { text: 'bananas', correctAnswers: [['100']], icon: 'banana.svg' },
            ]
        },
        {
            words: ['The', 'old', 'monkeys', 'get', '3', 'bananas', 'each', '.'],
            questions: [
                { text: 'old monkeys', correctAnswers: [['x']], icon: 'old_monkey.svg' },
                { text: 'bananas for old monkeys', correctAnswers: [['3', '⋅', 'x'], ['x', '⋅', '3'], ['3', 'x']], help_text: 'help_text_math' }
            ]
        },
        {
            words: ['Three', 'and', 'three', 'of', 'the', 'other', 'monkeys', 'share', 'one', 'banana', '.'],
            questions: [
                { text: 'other monkeys', correctAnswers: [['y']] },
                { text: 'bananas for other monkeys', correctAnswers: [['y', '/', '3']] }
            ]
        },
        {
            words: ['How', 'many', 'old', 'monkeys', 'are', 'there', '?'],
            questions: [
                    {
                        text: 'Create an equation from two different expressions for the total number of monkeys',
                        correctAnswers: [['x', '+', 'y', '=', '100'], ['y','+','x','=','100'], ['100','=','x','+','y'], ['100','=','y','+','x']],
                        separateLine: true,
                    },
                    {
                        text: 'Create an expression for how many bananas goes to the old monkeys in total',
                        correctAnswers: [['x', '⋅', '3'], ['3', '⋅', 'x'], ['3', 'x']],
                        separateLine: true,
                    },
                    {
                        text: 'Create an expression for how many bananas goes to the other monkeys in total',
                        correctAnswers: [['y', '/', '3']],
                        separateLine: true,
                    },
                    {
                        text: 'Create an equation from two different expressions for the total number of bananas',
                        correctAnswers: [['3','x','+','y','/','3','=','100']],
                        separateLine: true,
                    },
            ]
        },
        ],
        toolbar: [
            { symbol: '?', text: 'unknown x' },
            { symbol: '+', text: 'add' },
            { symbol: '⋅', text: 'multiply' },
            { symbol: '/', text: 'divide' },
            { symbol: '=', text: 'equals' },
        ],
        static_texts: {
            default_help_text: 'drag correct answer into the box<br/><i>or</i> drag the question mark (?) if unknown',
            help_text_math: 'drag correct answer into the box<br/><i>or</i> drag the question mark (?) if unknown',
        }
    };

    return exercise;
}

function Question(meta) {
    //this.meta = meta;
    this.text = meta.text;
    this.correctAnswers = meta.correctAnswers;
    this.icon = meta.icon;
    this.separateLine = meta.separateLine;

    this.isSolved = false;

    this.state = [];
}



Question.prototype.checkNew = function(newVal) {
    // copy array
    var state = this.state.slice(0);
    var correctAnswers = this.correctAnswers;

    state.push(newVal);

    console.log(state, newVal)

    var isSolved = correctAnswers.some(function(element, index, array){
        return (state.join(',') == element.join(','));
    })

    var isGood = correctAnswers.some(function(element, index, array){
        return (0 == element.join(',').indexOf(state.join(',')))
    });

    if (isSolved) {
        return 'solved';
    } else if (isGood) {
        return 'accept';
    } else {
        return 'reject';
    }

}

Question.prototype.init = function() {
    var self = this;

    this.el = $('<div>', {'class': 'q'});
    if (this.separateLine) {
        this.el.addClass('separate-line');
    }

    var field = $('<div>', {'class': 'field'});
    this.el.append(field);

    field.droppable({
        activeClass: 'ui-state-hover',
        hoverClass: 'ui-state-active',
        drop: function(event, ui) {
            $(this).addClass('ui-state-highlight');
            $(ui.draggable).data('hasBeenDropped', true);

            var val = ui.draggable.data('val');


            $(this).append(document.createTextNode(val));
            self.state.push(val);

            var solved = self.correctAnswers.some(function(element, index, array){
                return (element.join(',') === self.state.join(',')); 
            });

            if (solved) {
                self.solved = true;
                self.line.showNextQuestion();
            }

            window.zoob = self.line;
            if ('x' == val) {
                self.line.exercise.addNextUnknown();
            }
        },
        accept: function(d) {
            var val = d.data('val');

            if ('reject' == self.checkNew(val)) {
                return false;
            } else {
                return true;
            }

        }
    });

    if (this.icon) {
        var icon = $('<img>', {'src': 'icons/' + this.icon});
        this.el.append(icon)
    }

    var text = $('<div>', {'class': 'text', 'text': this.text});
    this.el.append(text);
}

function Line(meta) {
    this.meta = meta;
    this.complete = false;
    this.words = [];
    this.questions = [];
    this.el = $('<div>', {'class': 'line'});
    this.wordsEl = $('<div>', {'class': 'words'});
    this.el.append(this.wordsEl);
    this.qEl = $('<div>', {'class': 'questions'});
    this.el.append(this.qEl);
    this.canOpen = false; // ▶
    this.isOpen = false;  // ▼
}

Line.prototype.init = function(){
    var self = this;
    for (i in this.meta.words) {
        var word = {
            val: this.meta.words[i],
            el: $('<span>', {'text': this.meta.words[i], 'class': 'word', 'data-val': this.meta.words[i]})
        };

        word.el.draggable({
        revert:  function(dropped) {
             var $draggable = $(this),
                 hasBeenDroppedBefore = $draggable.data('hasBeenDropped'),
                 wasJustDropped = dropped && dropped[0].id == "droppable";
             if(wasJustDropped) {
                 // don't revert, it's in the droppable
                 return false;
             } else {
                 if (hasBeenDroppedBefore) {
                     // don't rely on the built in revert, do it yourself
                     $draggable.animate({ top: 0, left: 0 }, 'slow');
                     return false;
                 } else {
                     // just let the built in revert work, although really, you could animate to 0,0 here as well
                     return true;
                 }
             }
        }
    });

        this.words.push(word);
        this.wordsEl.append(word.el);
        this.wordsEl.append(document.createTextNode(" "));
    }

    for (i in this.meta.questions) {
        var question = new Question(this.meta.questions[i]);
        question.line = self;
        question.init();
        this.questions.push(question);
        if (0 == i) {
            this.qEl.append(question.el);
        }
    }
}

Line.prototype.showNextQuestion = function(){
    var solvedAll = true;
    for (i in this.questions) {
        if (!this.questions[i].solved) {
            this.qEl.append(this.questions[i].el);
            solvedAll = false;
            break;
        }
    }

    if (solvedAll) {
        this.exercise.nextLine();
    }
}

Line.prototype.canOpenOn = function (){
    this.canOpen = true;
    this.el.addClass('can-open');
    var arrow = $('<div>', {'class': 'arrow'});
    arrow.prependTo(this.el);
}

Line.prototype.open = function() {
    this.isOpen = true;
    this.el.addClass('is-open');
}

Line.prototype.close = function() {
    this.isOpen = false;
    this.el.removeClass('is-open');
}

function Exercise(meta) {
    this.meta = meta;
    this.lines = [];

    window.lines = this.lines;
}

Exercise.prototype.createToolbar = function ($el) {
    var toolbar = this.meta.toolbar;
    for (i in toolbar) {
        var symbol = $('<div>', {'text': toolbar[i].symbol});
        var text = $('<div>', {'text': toolbar[i].text});

        var data = toolbar[i].symbol == '?' ? 'x' : toolbar[i].symbol;
        var tool = $('<div>', {'class': 'tool', 'data-val': data});

        tool.append(symbol).append(text).appendTo($el);
        //////
        tool.draggable({
            revert:  function(dropped) {
                var $draggable = $(this),
                hasBeenDroppedBefore = $draggable.data('hasBeenDropped'),
                wasJustDropped = dropped && dropped[0].id == "droppable";
                if(wasJustDropped) {
                    // don't revert, it's in the droppable
                    return false;
                } else {
                    if (hasBeenDroppedBefore) {
                        // don't rely on the built in revert, do it yourself
                        $draggable.animate({ top: 0, left: 0 }, 'slow');
                        return false;
                    } else {
                        // just let the built in revert work, although really, you could animate to 0,0 here as well
                        return true;
                    }
                }
            }
        });
        //////
       
    }

    this.toolbarEl = $el;

}

Exercise.prototype.addNextUnknown = function() {
    var symbol = $('<div>', {'text': '?'});
    var text = $('<div>', {'text': 'unknown y'});

    var data = 'y';
    var tool = $('<div>', {'class': 'tool', 'data-val': data});
    tool.append(symbol).append(text);

    $('#toolbar').append(tool);

    tool.draggable({
            revert:  function(dropped) {
                var $draggable = $(this),
                hasBeenDroppedBefore = $draggable.data('hasBeenDropped'),
                wasJustDropped = dropped && dropped[0].id == "droppable";
                if(wasJustDropped) {
                    // don't revert, it's in the droppable
                    return false;
                } else {
                    if (hasBeenDroppedBefore) {
                        // don't rely on the built in revert, do it yourself
                        $draggable.animate({ top: 0, left: 0 }, 'slow');
                        return false;
                    } else {
                        // just let the built in revert work, although really, you could animate to 0,0 here as well
                        return true;
                    }
                }
            }
        });
}

Exercise.prototype.showLines = function($el) {
    var lines = this.meta.lines;

    var self = this;
    for (i in lines) {
        var line = new Line(lines[i]);
        line.init();
        $el.append(line.el); 
        self.lines.push(line);
        line.exercise = self;

        line.el.on('click', '.arrow', function(line){
            return function(){
                for (j in self.lines) {
                    self.lines[j].close();
                }

                line.open();
            }
        }(line));
    };

    this.lines[0].canOpenOn();


}

Exercise.prototype.nextLine = function () {
    for (i=0; i<this.lines.length; i++) {
        if (!this.lines[i].canOpen) {
            this.lines[i].canOpenOn();
            break;
        }
    }
}


$(document).ready(function(){
    var meta = createMetadata();
    var ex = new Exercise(meta);
    ex.createToolbar($('#toolbar'));
    ex.showLines($('#lines'));
});