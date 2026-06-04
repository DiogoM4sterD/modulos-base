Hooks.on("renderDialog", (app, html) => {
    SituationalShortcuts.processApplication(app);
});

Hooks.on("renderApplicationV2", (app, html, data) => {
    SituationalShortcuts.processApplication(app);
});

class SituationalShortcuts {

    static processApplication(app) {
        const html = $(app.element);
        const bonus = SituationalShortcuts.getInput(html);
        if (!bonus.length) return;
        const alreadyInjected = html.find(".situational-shortcuts").length;
        if (alreadyInjected) return;
        const bonuses = SituationalShortcuts.getBonuses();
        SituationalShortcuts.inject(bonuses, bonus);
        SituationalShortcuts.activateListerners(html, bonus);
        app.setPosition({
            height: "auto",
        });
    }


    static getBonuses() {
        const worldBonus = game.settings.get("situational-shortcuts", "worldBonusData");
        const userBonus = game.user.getFlag("situational-shortcuts", "userBonusData");
        const bonuses = foundry.utils.mergeObject(worldBonus, userBonus);
        const sortedKeys = Object.keys(bonuses).sort();
        const sortedBonuses = {};
        sortedKeys.forEach((key) => {
            sortedBonuses[key] = bonuses[key];
        });
        return sortedBonuses;
    }

    static generateElement(data) {
        let element = `<div class="situational-shortcuts">`;

        for (let [k, v] of Object.entries(data)) {
            element += `<div class="situational-shortcuts-btn" style="background-color: ${this.getColor(v)}" data-bonus="${v}">${k}</div>`;
        }

        element += `</div>`;
        return $(element);
    }

    static inject(bonuses, bonus) {
        const $bonusFg = bonus.closest(".form-group");
        const $bonusBonuses = SituationalShortcuts.generateElement(bonuses);
        $bonusFg.after($bonusBonuses);
    }

    static activateListerners(html) {

        if(html.hasClass("situational-shortcuts-listeners-added")) return;


        html.addClass("situational-shortcuts-listeners-added");

        const setValueAndTriggerChange = (input, value) => {
            input.value = value;
            input.dispatchEvent(new Event("change"));
            input.closest("form")?.dispatchEvent(new Event("change"))
        }

        html.on("click", ".situational-shortcuts-btn", (e) => {
            const $btn = $(e.currentTarget);
            let bonus = String($btn.data("bonus"));
            if (!bonus.startsWith("+")) bonus = "+" + bonus;
            const input = $btn.closest(".situational-shortcuts").prev(".form-group").find("input")[0]
            if (game.settings.get("situational-shortcuts", "replaceMode")) {
                let expression = SituationalShortcuts.prepareExpression(bonus);
                setValueAndTriggerChange(input, expression);
                return;
            }
            let newExpression = SituationalShortcuts.prepareExpression(input.value + bonus);
            newExpression = newExpression.replace(/\s/g, "");
            setValueAndTriggerChange(input, newExpression);
        });
        html.on("contextmenu", ".situational-shortcuts-btn", (e) => {
            const $btn = $(e.currentTarget);
            let bonus = String($btn.data("bonus"));
            const input = $btn.closest(".situational-shortcuts").prev(".form-group").find("input")[0]
            //add a plus at the beginning of the bonus if it doesn't exist
            if (!bonus.startsWith("+")) bonus = "+" + bonus;
            //loop trough all the characters of bonus
            let reversedBonus = "";
            for (let i = 0; i < bonus.length; i++) {
                if (bonus[i] == "+") reversedBonus += "-";
                else if (bonus[i] == "-") reversedBonus += "+";
                else reversedBonus += bonus[i];
            }
            if (game.settings.get("situational-shortcuts", "replaceMode")) {
                let expression = SituationalShortcuts.prepareExpression(reversedBonus);
                setValueAndTriggerChange(input, expression);
                return;
            }
            let newExpression = SituationalShortcuts.prepareExpression(input.value + reversedBonus);
            newExpression = newExpression.replace(/\s/g, "");
            setValueAndTriggerChange(input, newExpression);
        });
    }

    static getColor(bonus) {
        const useColor = game.settings.get("situational-shortcuts", "bonusColors");
        if (!useColor) return "#00000014";
        if (bonus.startsWith("+")) {
            return "#10ff0036";
        }
        if (bonus.startsWith("-")) {
            return "#ff000047";
        }
        return "#00000014";
    }

    static prepareExpression(string) {
        //remove all the spaces
        string = string.replace(/\s/g, "");
        //add a : before every + or -
        string = string.replace(/([\+\-])/g, ":$1");
        //if the string does not start with + or -, add a +
        if (!string.startsWith("+") && !string.startsWith("-")) string = "+" + string;
        //split the string by the : character
        let parts = string.split(":");
        //remove empty parts
        parts = parts.filter(Boolean);
        //isolate special expression that include special characters
        const specialChars = ["@", "!", "*", "&", "|", "^", "~", ">", "<", "(", ")", "[", "]", "/"];
        //filter parts that contain special characters
        let specialExpression = parts.filter((part) => specialChars.some((char) => part.includes(char)));
        //condense special expression into a single string
        specialExpression = specialExpression.join("");
        //remove special expression from the parts array
        parts = parts.filter((part) => !specialChars.some((char) => part.includes(char)));
        //divide the parts by the ones that include the d character
        let diceArray = parts.filter((part) => part.includes("d"));
        //filter the parts that do not include the d character
        let values = parts.filter((part) => !part.includes("d"));
        //convert the values to numbers and add them to a single value
        let total = values.map((value) => parseInt(value));
        //remove invalid values
        total = total.filter((value) => Number.isInteger(value));
        //add up the total
        total = total.length ? String(total.reduce((a, b) => a + b)) : "";
        //if the total does not start with a + or -, add a +
        if (!total.startsWith("+") && !total.startsWith("-") && total !== "") total = "+" + total;
        // convert the diceArray to an array of objects with the dice and sides
        let dice = diceArray.map((dice) => {
            let sideValue = dice.split("d");
            return {
                dice: parseInt(sideValue[0]),
                sides: parseInt(sideValue[1]),
            };
        });
        //condense the dice array
        dice = this.condenseDiceArray(dice);
        //rebuild the string
        let diceString = "";
        for (let [side, value] of Object.entries(dice)) {
            if (value === 0) continue;
            let parsedDice = `${value}d${side}`;
            //if parsedDice does not start with a + or -, add a +
            if (!parsedDice.startsWith("+") && !parsedDice.startsWith("-")) parsedDice = "+" + parsedDice;
            diceString += parsedDice;
        }
        let result = `${diceString}${total}${specialExpression}`;
        //if the result starts with a + remove it
        if (result.startsWith("+")) result = result.replace("+", "");
        //add a space before and after every + or -
        result = result.replace(/([\+\-])/g, " $1 ");
        return result;
    }

    static condenseDiceArray(diceArray) {
        const diceOutput = {};
        diceArray.forEach((dice) => {
            if (!diceOutput[dice.sides]) diceOutput[dice.sides] = 0;
            diceOutput[dice.sides] += dice.dice;
        });
        //sort the diceOutput
        const sortedDiceOutput = {};
        const sortedKeys = Object.keys(diceOutput).sort((a, b) => a - b);
        sortedKeys.forEach((key) => {
            sortedDiceOutput[key] = diceOutput[key];
        });
        return sortedDiceOutput;
    }

    static getInput(html) {
        switch (game.system.id) {
            case "dnd5e":
                const basicInput = html.find(`input[name="bonus"]`);
                if (basicInput.length) return basicInput;
                return html.find(`input[name="roll.0.situational"]`);
            case "wfrp4e":
                return html.find(`input[name="testModifier"], input[name="advantage"], input[name="slBonus"], input[name="successBonus"]`);
            case "sw5e":
                return html.find(`input[name="bonus"]`);
        }
    }
}
