'use strict';
const css = require('../sass/main.scss');

// PLAYERS AND THEIR DRAFT PICKS
const players = [
    {
        name: 'shalyse',
        draftPicks: ['jon', 'tyrion', 'brienne', 'jaime']
    },
    {
        name: 'shelby',
        draftPicks: ['daenerys', 'arya', 'littlefinger', 'bran']
    },
    {
        name: 'cam',
        draftPicks: ['yara', 'grey worm', 'tormund', 'euron']
    },
    {
        name: 'dallen',
        draftPicks: ['mountain', 'night king', 'davos', 'hound']
    }
]

// DATA SET ON AJAX
let scoring = null;
let characterTallies = null;
let characterScorecards = null;
let playerScorecards = null;

// DOM REFS
const DOM = {
    scorecards: document.getElementById('scorecards')
}

// METHODS
function getCharacterScorecards () {
    let characterScorecards = characterTallies;
    characterScorecards.forEach(character => {
        character.totalPoints = 0;
        // multiply all score tallies by corresponding point reference
        for (let criteria in character.scorecard) {
            let totalCriteria = `total${criteria.charAt(0).toUpperCase() + criteria.slice(1)}`;
            character[totalCriteria] = 0;
            for (let score in character.scorecard[criteria]) {
                character.scorecard[criteria][score] = character.scorecard[criteria][score] * scoring[criteria][score];
                character.totalPoints += character.scorecard[criteria][score];
                character[totalCriteria] += character.scorecard[criteria][score];
            }
        }
    });
    return characterScorecards;
}
function getPlayerScorecards () {
    let playerScorecards = [];
    players.forEach(player => {
        let playerScorecard = {};
        playerScorecard.name = player.name;
        playerScorecard.team = characterScorecards.filter(characterScorecard => {
            if (player.draftPicks.indexOf(characterScorecard.name) !== -1) {
                return characterScorecard;
            }
        }).sort((a, b) => {
            return b.totalPoints - a.totalPoints;
        });
        for (let criteria in scoring) {
            let totalCriteria = `total${criteria.charAt(0).toUpperCase() + criteria.slice(1)}`;
            playerScorecard[totalCriteria] = 0;
            playerScorecard.team.forEach(member => {
                playerScorecard[totalCriteria] += member[totalCriteria];
            });
        }
        playerScorecard.totalPoints = 0;
        playerScorecard.open = false;
        playerScorecard.team.forEach(teamMember => {
            playerScorecard.totalPoints += teamMember.totalPoints;
        });
        playerScorecards.push(playerScorecard);
    });
    for (let criteria in scoring) {
        let mostCriteria = `most${criteria.charAt(0).toUpperCase() + criteria.slice(1)}`;
        let totalCriteria = `total${criteria.charAt(0).toUpperCase() + criteria.slice(1)}`;
        playerScorecards.forEach(scorecard => {
            scorecard[mostCriteria] = false;
        });
        let criteriaRankings = playerScorecards.sort((a, b) => {
            return b[totalCriteria] - a[totalCriteria];
        });
        if (criteriaRankings[0][totalCriteria] > criteriaRankings[1][totalCriteria]) {
            criteriaRankings[0][mostCriteria] = true;
        }
    }
    return playerScorecards.sort((a, b) => {
        return b.totalPoints - a.totalPoints;
    });
}
function getPlayerRankings () {
    let uniqueTotals = [];
    playerScorecards.forEach(scorecard => {
        if (uniqueTotals.indexOf(scorecard.totalPoints) === -1) {
            uniqueTotals.push(scorecard.totalPoints);
        }
    });
    return uniqueTotals;
}
function loadPlayerScorecards () {
    playerScorecards.forEach((scorecard, index) => {

        let templateRoot = document.createElement('DIV');
        templateRoot.setAttribute('class', 'scorecard');

        let getTeamMembers = function () {
            let membersTemplate = '';
            scorecard.team.forEach((member, index) => {
                if (index === 0 && member.totalPoints > scorecard.team[1].totalPoints) {
                    membersTemplate += `<th class="team-mvp">${ member.name }</th>`;
                } else {
                    membersTemplate += `<th>${ member.name }</th>`;
                }
            });
            return membersTemplate;
        }

        let getCriteriaAndScoreItems = function () {

            // score items template
            let getScoreItems = function (criteria, criteriaItems) {
                let scoreItemTemplate = '';
                let rowTotal = 0;
                let bestColumnScore = 0;
                scorecard.team.forEach(member => {
                    let columnScore = member.scorecard[criteria][criteriaItems];
                    if (columnScore !== 0 && columnScore > bestColumnScore) {
                        bestColumnScore = columnScore;
                    }
                    rowTotal += columnScore;
                    scoreItemTemplate += `<td>${ columnScore }</td>`;
                });
                let rowTotalTemplate = `<td class="row-total">${ rowTotal }</td>`;
                /* uncomment for row total
                return scoreItemTemplate + rowTotalTemplate; */
                return scoreItemTemplate;
            }

            // criteria item template
            let getCriteriaItems = function (criteria) {
                let criteriaItemTemplate = '';
                for (let criteriaItems in scorecard.team[0].scorecard[criteria]) {
                    criteriaItemTemplate += `<tr class="score-items">
                    <td>${ unCamelize(criteriaItems) }</td>
                    ${ getScoreItems(criteria, criteriaItems) }
                    </tr>`;
                }
                return criteriaItemTemplate;
            }

            // column totals template
            let getColumnTotals = function () {
                let columnTotalsTemplate = '';
                scorecard.team.forEach(member => {
                    columnTotalsTemplate += `<td>${ member.totalPoints }</td>`;
                });
                // return columnTotalsTemplate + `<td>${ scorecard.totalPoints }</td>`;
                return columnTotalsTemplate;
            }

            // criteria and score items template
            let scoreTemplate = '';
            for (let criteria in scorecard.team[0].scorecard) {
                scoreTemplate += `<tr class="score-category">
                <td>${ criteria }</td>
                </tr>
                ${ getCriteriaItems(criteria) }`;
            }
            return scoreTemplate + `<tr class="column-totals"><td style="opacity: 0;">Totals:</td>${ getColumnTotals() }</tr>`;
        }

        let getAwards = function () {
            let awardsRootTemplate = '';
            let awards = [];
            for (let criteria in scoring) {
                let mostCriteria = `most${criteria.charAt(0).toUpperCase() + criteria.slice(1)}`;
                if (scorecard[mostCriteria]) {awards.push(mostCriteria);}
            }
            if (awards.length) {
                let loadAwards = function () {
                    let awardsTemplate = '';
                    awards.forEach(award => {
                        awardsTemplate += `<li class="${ unCamelize(award, '-') }">${ unCamelize(award) } - ${ commalizeNumber(scorecard[award.replace('most', 'total')]) }</li>`
                    });
                    return awardsTemplate;
                }
                awardsRootTemplate = `<ul class="awards"><li>Awards</li>${ loadAwards() }</ul>`;
            }
            return awardsRootTemplate;
        }

        let template = `<div class="overview">
        <div class="scorecard-name">${ scorecard.name }</div>
        <div>${ commalizeNumber(scorecard.totalPoints) }</div>
        </div>
        ${ getAwards() }
        <div class="team">
        <table>
        <tr class="team-members">
        <th style="opacity: 0;">Character:</th>
        ${ getTeamMembers() }
        <th style="opacity: 0; display: none;">Total:</th>
        </tr>
        ${ getCriteriaAndScoreItems() }
        </table>
        </div>`

        let toggleTeamEl = document.createElement('BUTTON');
        toggleTeamEl.setAttribute('class', 'team-toggle');
        toggleTeamEl.addEventListener('click', () => {toggleTeam(index)});

        let playerRankings = getPlayerRankings();
        playerRankings.forEach((rankScore, index) => {
            if (scorecard.totalPoints === rankScore) {
                templateRoot.classList.add(`rank-${ index + 1 }`);
            }
        });

        templateRoot.innerHTML = template;
        templateRoot.appendChild(toggleTeamEl);
        DOM.scorecards.appendChild(templateRoot);

    });
}
function toggleTeam(index) {
    let thisCard = playerScorecards[index];
    if (thisCard.open) {
        DOM.scorecards.children[index].classList.remove('open-team');
        thisCard.open = false;
    } else {
        DOM.scorecards.children[index].classList.add('open-team');
        thisCard.open = true;
    }
}
function handleScroll () {
    for (let i = 0; i < DOM.scorecards.children.length; i++) {
        console.log('card ' + i + ' is : ' + DOM.scorecards.children[i].getBoundingClientRect().top)
    }
}
function init () {
    let getFantasyData = new XMLHttpRequest();
    getFantasyData.open('GET', `https://codepen.io/camstephensdomo/pen/rwbwde.js`);
    getFantasyData.onload = () => {
        if (getFantasyData.status === 200) {
            let fantasyData = JSON.parse(getFantasyData.responseText);
            scoring = fantasyData[0];
            characterTallies = fantasyData[1];
            characterScorecards = getCharacterScorecards();
            playerScorecards = getPlayerScorecards();
            return loadPlayerScorecards();
        } else {
            console.log(`getFantasyData request failed. Returned status of ${getFantasyData.status}.`);
        }
    }
    getFantasyData.send();
    // window.addEventListener('scroll', _.throttle(handleScroll, 100)); *load in lodash for this if used
}

// UTILITY METHODS
function sortCharacterScorecards (key='totalPoints') {
    let sortedScorecards = characterScorecards.sort((a, b) => {
        return b[key] - a[key];
    });
    return sortedScorecards;
}
function unCamelize(text, separator = " ") {
    return text.replace(/[A-Z]/g, letter => separator + letter.toLowerCase()).replace("/^" + separator + "/", "");
}
function commalizeNumber(string) {
    return string.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// INIT
init();
