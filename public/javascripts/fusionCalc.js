var outputLeft = document.getElementById("outputarealeft");
var outputRight = document.getElementById("outputarearight");
var HAND_SLOTS = 10;

// Initialize Awesomplete
var _awesompleteOpts = {
    list: card_db()
        .get()
        .map((c) => c.Name),
    autoFirst: true,
    filter: Awesomplete.FILTER_STARTSWITH,
};

var handCompletions = {};
for (var i = 1; i <= HAND_SLOTS; i++) {
    var hand = document.getElementById("hand" + i);
    if (hand) {
        handCompletions["hand" + i] = new Awesomplete(hand, _awesompleteOpts);
    }
}

function getCardByName(cardname) {
    return card_db({ Name: { isnocase: cardname } }).first();
}

function getCardById(id) {
    var card = card_db({ Id: id }).first();
    return card || null;
}

function formatStats(attack, defense) {
    return "(" + attack + "/" + defense + ")";
}

function isMonster(card) {
    return card && card.Type < 20;
}

function getGuardianStars(card) {
    if (!card || !isMonster(card)) {
        return "";
    }

    var starA = starNames[(card.GuardianStarA || 0) - 1] || "?";
    var starB = starNames[(card.GuardianStarB || 0) - 1] || "?";
    return starA + " / " + starB;
}

function checkCard(cardname, infoname) {
    var info = $("#" + infoname);
    var trimmedName = (cardname || "").trim();

    if (trimmedName === "") {
        info.html("");
        return;
    }

    var card = getCardByName(trimmedName);

    if (!card) {
        info.html("Invalid card name");
        return;
    }

    if (isMonster(card)) {
        info.html(
            formatStats(card.Attack, card.Defense) +
                " [" +
                cardTypes[card.Type] +
                "]" +
                "<br><small>" +
                getGuardianStars(card) +
                "</small>"
        );
    } else {
        info.html("[" + cardTypes[card.Type] + "]");
    }
}

// Creates a div for each fusion/equip
function fusesToHTML(fuselist, mode) {
    return fuselist
        .map(function (fusion) {
            if (mode === "fusion") {
                var res =
                    "<div class='result-div'>Input: " +
                    fusion.card1.Name +
                    "<br>Input: " +
                    fusion.card2.Name +
                    "<br>Result: " +
                    fusion.result.Name;

                if (isMonster(fusion.result)) {
                    res +=
                        " " +
                        formatStats(fusion.result.Attack, fusion.result.Defense) +
                        "<br><small>" +
                        getGuardianStars(fusion.result) +
                        "</small>";
                } else {
                    res += " [" + cardTypes[fusion.result.Type] + "]";
                }

                return res + "</div>";
            }

            return (
                "<div class='result-div'>Input: " +
                fusion.card1.Name +
                "<br>Input: " +
                fusion.card2.Name +
                "</div>"
            );
        })
        .join("\n");
}

function findFusions() {
    var cards = [];

    for (var i = 1; i <= HAND_SLOTS; i++) {
        var handInput = $("#hand" + i);
        if (!handInput.length) continue;

        var name = handInput.val().trim();
        if (!name) continue;

        var card = getCardByName(name);
        if (card) {
            cards.push(card);
        }
    }

    var fuses = [];
    var equips = [];

    for (var i = 0; i < cards.length - 1; i++) {
        var card1 = cards[i];
        var card1Fuses = fusionsList[card1.Id] || [];
        var card1Equips = equipsList[card1.Id] || [];

        for (var j = i + 1; j < cards.length; j++) {
            var card2 = cards[j];

            var fusion = card1Fuses.find(function (f) {
                return f.card === card2.Id;
            });

            if (fusion) {
                var resultCard = getCardById(fusion.result);
                if (resultCard) {
                    fuses.push({
                        card1: card1,
                        card2: card2,
                        result: resultCard,
                    });
                }
            }

            var equip = card1Equips.find(function (e) {
                return e === card2.Id;
            });

            if (equip) {
                equips.push({
                    card1: card1,
                    card2: card2,
                });
            }
        }
    }

    outputLeft.innerHTML = "<h2 class='center'>Fusions:</h2>";
    if (fuses.length > 0) {
        fuses.sort(function (a, b) {
            return b.result.Attack - a.result.Attack;
        });
        outputLeft.innerHTML += fusesToHTML(fuses, "fusion");
    }

    outputRight.innerHTML = "<h2 class='center'>Equips:</h2>";
    if (equips.length > 0) {
        outputRight.innerHTML += fusesToHTML(equips, "equip");
    }
}

function resultsClear() {
    outputLeft.innerHTML = "";
    outputRight.innerHTML = "";
}

function inputsClear() {
    for (var i = 1; i <= HAND_SLOTS; i++) {
        $("#hand" + i).val("");
        $("#hand" + i + "-info").html("");
    }
}

for (var i = 1; i <= HAND_SLOTS; i++) {
    if (!$("#hand" + i).length) continue;

    $("#hand" + i).on("change", function () {
        if (handCompletions[this.id]) {
            handCompletions[this.id].select();
        }

        if (this.value === "") {
            $("#" + this.id + "-info").html("");
        } else {
            checkCard(this.value, this.id + "-info");
        }

        resultsClear();
        findFusions();
    });

    $("#hand" + i).on("awesomplete-selectcomplete", function () {
        checkCard(this.value, this.id + "-info");
        resultsClear();
        findFusions();
    });

    $("#hand" + i).on("input", function () {
        if (this.value.trim() === "") {
            $("#" + this.id + "-info").html("");
            resultsClear();
            findFusions();
        }
    });
}

$("#resetBtn").on("click", function () {
    resultsClear();
    inputsClear();
});
