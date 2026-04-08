var outputLeft = document.getElementById("outputarealeft");
var outputRight = document.getElementById("outputarearight");

function getAllCardNames() {
    return card_db()
        .get()
        .map(function (c) {
            return c.Name;
        });
}

// Initialize Awesomplete
var _awesompleteOpts = {
    list: getAllCardNames(),
    autoFirst: true,
    filter: Awesomplete.FILTER_STARTSWITH,
};

var handCompletions = {};
for (var i = 1; i <= 5; i++) {
    var hand = document.getElementById("hand" + i);
    handCompletions["hand" + i] = new Awesomplete(hand, _awesompleteOpts);
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
    if (!isMonster(card)) return "";
    var starA = starNames[card.GuardianStarA] || "?";
    var starB = starNames[card.GuardianStarB] || "?";
    return starA + " / " + starB;
}

function checkCard(cardname, infoname) {
    var info = $("#" + infoname);
    var trimmed = (cardname || "").trim();

    if (trimmed === "") {
        info.html("");
        return;
    }

    var card = getCardByName(trimmed);
    if (!card) {
        info.html("<span class='text-danger'>Invalid card name</span>");
        return;
    }

    if (isMonster(card)) {
        info.html(
            formatStats(card.Attack, card.Defense) +
                " [" +
                cardTypes[card.Type] +
                "]" +
                "<br><small>Stars: " +
                getGuardianStars(card) +
                "</small>"
        );
    } else {
        info.html("[" + cardTypes[card.Type] + "]");
    }
}

function makeFusionKey(card1, card2, resultId) {
    var ids = [card1.Id, card2.Id].sort(function (a, b) {
        return a - b;
    });
    return "F|" + ids[0] + "|" + ids[1] + "|" + resultId;
}

function makeEquipKey(card1, card2) {
    return "E|" + card1.Id + "|" + card2.Id;
}

function fusesToHTML(fuselist, mode) {
    return fuselist
        .map(function (fusion) {
            if (mode === "fusion") {
                var res =
                    "<div class='result-div'>" +
                    "<strong>Input:</strong> " +
                    fusion.card1.Name +
                    "<br><strong>Input:</strong> " +
                    fusion.card2.Name +
                    "<br><strong>Result:</strong> " +
                    fusion.result.Name;

                if (isMonster(fusion.result)) {
                    res +=
                        " " +
                        formatStats(fusion.result.Attack, fusion.result.Defense) +
                        " [" +
                        cardTypes[fusion.result.Type] +
                        "]" +
                        "<br><small>Stars: " +
                        getGuardianStars(fusion.result) +
                        "</small>";
                } else {
                    res += " [" + cardTypes[fusion.result.Type] + "]";
                }

                return res + "<br><br></div>";
            }

            return (
                "<div class='result-div'>" +
                "<strong>Monster:</strong> " +
                fusion.card1.Name +
                "<br><strong>Equip:</strong> " +
                fusion.card2.Name +
                "<br><br></div>"
            );
        })
        .join("\n");
}

function findFusions() {
    var cards = [];

    for (var i = 1; i <= 5; i++) {
        var name = $("#hand" + i).val().trim();
        if (!name) continue;

        var card = getCardByName(name);
        if (card) cards.push(card);
    }

    var fuses = [];
    var equips = [];
    var seenFusions = {};
    var seenEquips = {};

    for (var i = 0; i < cards.length - 1; i++) {
        var card1 = cards[i];

        for (var j = i + 1; j < cards.length; j++) {
            var card2 = cards[j];

            var card1Fuses = fusionsList[card1.Id] || [];
            var card2Fuses = fusionsList[card2.Id] || [];
            var card1Equips = equipsList[card1.Id] || [];
            var card2Equips = equipsList[card2.Id] || [];

            var fusion =
                card1Fuses.find(function (f) {
                    return f.card === card2.Id;
                }) ||
                card2Fuses.find(function (f) {
                    return f.card === card1.Id;
                });

            if (fusion) {
                var resultCard = getCardById(fusion.result);
                if (resultCard) {
                    var fusionKey = makeFusionKey(card1, card2, resultCard.Id);
                    if (!seenFusions[fusionKey]) {
                        seenFusions[fusionKey] = true;
                        fuses.push({
                            card1: card1,
                            card2: card2,
                            result: resultCard,
                        });
                    }
                }
            }

            var equip12 = card1Equips.find(function (e) {
                return e === card2.Id;
            });
            if (equip12) {
                var equipKey12 = makeEquipKey(card1, card2);
                if (!seenEquips[equipKey12]) {
                    seenEquips[equipKey12] = true;
                    equips.push({ card1: card1, card2: card2 });
                }
            }

            var equip21 = card2Equips.find(function (e) {
                return e === card1.Id;
            });
            if (equip21) {
                var equipKey21 = makeEquipKey(card2, card1);
                if (!seenEquips[equipKey21]) {
                    seenEquips[equipKey21] = true;
                    equips.push({ card1: card2, card2: card1 });
                }
            }
        }
    }

    outputLeft.innerHTML = "<h2 class='center'>Fusions:</h2>";
    if (fuses.length > 0) {
        fuses.sort(function (a, b) {
            var atkA = isMonster(a.result) ? a.result.Attack : -1;
            var atkB = isMonster(b.result) ? b.result.Attack : -1;
            return atkB - atkA;
        });
        outputLeft.innerHTML += fusesToHTML(fuses, "fusion");
    } else {
        outputLeft.innerHTML += "<div class='result-div'>No fusions found.</div>";
    }

    outputRight.innerHTML = "<h2 class='center'>Equips:</h2>";
    if (equips.length > 0) {
        outputRight.innerHTML += fusesToHTML(equips, "equip");
    } else {
        outputRight.innerHTML += "<div class='result-div'>No equips found.</div>";
    }
}

function resultsClear() {
    outputLeft.innerHTML = "";
    outputRight.innerHTML = "";
}

function inputsClear() {
    for (var i = 1; i <= 5; i++) {
        $("#hand" + i).val("");
        $("#hand" + i + "-info").html("");
    }
}

for (var i = 1; i <= 5; i++) {
    $("#hand" + i).on("change", function () {
        if (this.value === "") {
            $("#" + this.id + "-info").html("");
        } else {
            handCompletions[this.id].evaluate();
            checkCard(this.value, this.id + "-info");
        }
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

    $("#hand" + i).on("awesomplete-selectcomplete", function () {
        checkCard(this.value, this.id + "-info");
        resultsClear();
        findFusions();
    });
}

$("#resetBtn").on("click", function () {
    resultsClear();
    inputsClear();
});
