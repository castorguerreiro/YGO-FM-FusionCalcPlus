$(document).ready(function () {
    const handInputs = ["#hand1", "#hand2", "#hand3", "#hand4", "#hand5"];
    const infoSpans = ["#hand1-info", "#hand2-info", "#hand3-info", "#hand4-info", "#hand5-info"];

    const cardMap = {};
    for (let card of cards) {
        cardMap[card.name.toLowerCase()] = card;
    }

    function getCard(name) {
        return cardMap[name.toLowerCase()] || null;
    }

    function getStars(card) {
        if (!card || card.type === "Equip") return "";
        return `⭐ ${card.star1 || ""} / ${card.star2 || ""}`;
    }

    function formatCardInfo(card) {
        if (!card) return `<span class="text-danger">Invalid card</span>`;

        let stars = getStars(card);

        return `
            <span class="text-dark">
                ATK: ${card.atk} / DEF: ${card.def} |
                ${card.type}
                ${stars ? `<br>${stars}` : ""}
            </span>
        `;
    }

    function getAllCardsFromHand() {
        let result = [];
        handInputs.forEach((id) => {
            let val = $(id).val().trim();
            if (val) {
                let card = getCard(val);
                if (card) result.push(card);
            }
        });
        return result;
    }

    function findFusions(cardsInHand) {
        let fusionResults = [];
        let equipResults = [];
        let seen = new Set();

        for (let i = 0; i < cardsInHand.length; i++) {
            for (let j = i + 1; j < cardsInHand.length; j++) {
                let a = cardsInHand[i];
                let b = cardsInHand[j];

                let key = `${a.id}-${b.id}`;
                if (seen.has(key)) continue;
                seen.add(key);

                let result = null;

                // Check fusion both orders
                result = fusions[a.id]?.[b.id] || fusions[b.id]?.[a.id];

                if (result) {
                    let resultCard = cards[result];
                    fusionResults.push({
                        result: resultCard,
                        recipe: `${a.name} + ${b.name}`
                    });
                    continue;
                }

                // Check equips
                if (equips[a.id]?.includes(b.id)) {
                    equipResults.push(`${b.name} equips to ${a.name}`);
                }
                if (equips[b.id]?.includes(a.id)) {
                    equipResults.push(`${a.name} equips to ${b.name}`);
                }
            }
        }

        return { fusionResults, equipResults };
    }

    function renderResults(fusionsList, equipsList) {
        let left = $("#outputarealeft");
        let right = $("#outputarearight");

        left.empty();
        right.empty();

        if (fusionsList.length === 0 && equipsList.length === 0) {
            left.html(`<p class="text-danger">No results found.</p>`);
            return;
        }

        fusionsList.sort((a, b) => b.result.atk - a.result.atk);

        for (let f of fusionsList) {
            left.append(`
                <div class="mb-2 p-2 border rounded bg-white">
                    <strong>${f.result.name}</strong><br>
                    ATK ${f.result.atk} / DEF ${f.result.def}<br>
                    ${f.result.type}<br>
                    <small>${f.recipe}</small>
                </div>
            `);
        }

        for (let e of equipsList) {
            right.append(`
                <div class="mb-2 p-2 border rounded bg-white">
                    ${e}
                </div>
            `);
        }
    }

    function updateAll() {
        let cardsInHand = getAllCardsFromHand();

        handInputs.forEach((id, index) => {
            let val = $(id).val().trim();
            let card = getCard(val);
            $(infoSpans[index]).html(formatCardInfo(card));
        });

        let { fusionResults, equipResults } = findFusions(cardsInHand);
        renderResults(fusionResults, equipResults);
    }

    handInputs.forEach((id) => {
        $(id).on("input", updateAll);
    });

    $("#resetBtn").click(function () {
        handInputs.forEach((id) => $(id).val(""));
        infoSpans.forEach((id) => $(id).html(""));
        $("#outputarealeft").empty();
        $("#outputarearight").empty();
    });
});
