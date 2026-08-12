import games from "../data/games";

const gameRules = [
  {
    name: "Flip Cup",
    payouts:
      "Loss: 1 spin, Win: 2 spins, Shutout: .5 spins",
    rules:
      "Best 4 of 7, Hand in pocket",
  },
  {
    name: "Baseball",
    payouts:
      "Loss: 1 spin, Win: 2 spins, Shutout: .5 spins",
    rules:
      "9 innings, hand in pocket on bases",
  },
  {
    name: "Beer Pong",
    payouts:
      "0 Wins: .5 spin, 1 Win: 1 spin, 2 Win: 2 spins, Shutout/Ring of Fire: .5 spin",
    rules:
      "Rebuttles, OT is 3 cups with 1 on top",
  },
  {
    name: "Relay Race",
    payouts:
      "Loss: 1 spin, Win: 2 spins",
    rules: "",
  },
  {
    name: "Cornhole",
    payouts:
      "0 Wins: .5 spin, 1 Win: 1 spin, 2 Win: 2 spins, Shutout: .5 spin",
    rules:
      "Game to 15 win by 2, not exact, total points cancel",
  },
  {
    name: "Ladderball",
    payouts:
      "0 Wins: .5 spin, 1 Win: 1 spin, 2 Win: 2 spins, Shutout: .5 spin",
    rules:
      "Game to 15 win by 2, not exact, total points cancel",
  },
  {
    name: "Kan Jam",
    payouts:
      "0 Wins: .5 spin, 1 Win: 1 spin, 2 Win: 2 spins, Shutout/Slot: .5 spin",
    rules:
      "Game to 21 win by 2, not exact. Over 21 back to 15. OT increases by 7 per round. Slot puts you at 21 or the next OT threshold, not auto win. Hitting the disc in the can but back out the slot is only 1 point.",
  },
  {
    name: "HR Derby",
    payouts:
      "Loss: 1 spin, Win: 2 spins, 5 Money Balls: .5 spins for team",
    rules:
      "7 outs per hitter. Last out per hitter is a money ball still worth 1 HR.",
  },
  {
    name: "Polish Horseshoes",
    payouts:
      "0 Wins: .5 spin, 1 Win: 1 spin, 2 Win: 2 spins, Shutout: .5 spin",
    rules:
      "Game to 15 win by 2, no rebuttle. Frisbee and bottle each worth 1 point when hitting the ground unless bottle is hit directly, then the bottle is worth 2.",
  },
  {
    name: "Beer Die",
    payouts:
      "0 Wins: .5 spin, 1 Win: 1 spin, 2 Win: 2 spins, Shutout: .5 spin",
    rules:
      "Game to 15 win by 2, no rebuttle. Oops can be passed to teammates or done solo, all worth 1 point. Own cup is -1. Dice is worth 1, hitting the cup then ground is 2, splash is 3 points.",
  },
  {
    name: "Spikeball",
    payouts:
      "0 Wins: .5 spin, 1 Win: 1 spin, 2 Win: 2 spins, Shutout: .5 spin",
    rules:
      "Game to 21 win by 2, points scored on all possessions. Rim counts as ground after the server. Bustin rule: Ball hits net then rim, it's the team that last touched the ball's point. Ball hits net, then rim but stays on the net, it's the team that did not last hit the ball's point.",
  },
  {
    name: "Thunderchug",
    payouts:
      "All: 1 spin",
    rules: "",
  },
  {
    name: "Beerball",
    payouts:
      "0 Wins: .5 spin, 1 Win: 1 spin, 2 Win: 1.5 spins, 3 Win: 2.5 spins",
    rules:
      "If a beer can gets knocked off the table it's a brand new but cracked beer. Can place the can anywhere on table so it doesn't fall off. Spillage but not falling off the table is an equal amount drink for the opposing team. To consider a beer empty it must be checked and approved by the other team or an observer, or dumped over the head, or fill a bottle cap and if it overflows it's a new beer.",
  },
  {
    name: "Civil War",
    payouts:
      "0 Wins: .5 spin, 1 Win: 1 spin, 2 Win: 1.5 spins, 3 Win: 2.5 spins, Shutout: .5 spins",
    rules:
      "Must finish any hit cups before you can shoot again. Knocked over cups are out. Eliminated players can play defense and retrieve balls but not shoot.",
  },
  {
    name: "Fuck Yeah",
    payouts:
      "7th: .5 spin, 6th-5th: 1 spin, 4th: 1.5 spins, 3rd: 2 spins, 2nd: 2.5 spins, 1st: 3 spins, All lives left: .5 spins",
    rules:
      "3 Lives, Hand in pocket, Can use body but not 2nd arm",
  },
  {
    name: "Mouse Trap",
    payouts:
      "7th: .5 spin, 6th-5th: 1 spin, 4th: 1.5 spins, 3rd: 2 spins, 2nd: 2.5 spins, 1st: 3 spins, All lives left: .5 spins",
    rules:
      "3 Lives, Hand in pocket",
  },
  {
    name: "Liars Dice",
    payouts:
      "14th-11th: .5 spin, 10th-7th: 1 spin, 6th-4th: 1.5 spins, 3rd: 2 spins, 2nd: 2.5 spins, 1st: 3 spins, Spot on call with 18+ dice left: .5 spin",
    rules: "",
  },
  {
    name: "Elimination Chamber",
    payouts:
      "GM 1/2 — 1st: 1.5 spins, 2nd-3rd: 1 spin, 4th W/L: 1 spin/.5 spins, 5th-7th: 0 spin\n\nLs — 1st: 1.5 spins, 2nd-3rd: 1 spin, 4th-7th: .5 spin\n\nWs — 1st: 1.5 spins, 2nd-3rd: 1 spin, 4th-6th: .5 spin, 7th: 0 spin\n\nHave all 3 cups remaining = .5 spin",
    rules:
      "Need to flip cups in order. Hand in pocket. No cups are eliminated if last cups are a tie. Tie if the cup is in the air at the same time, not when it lands.",
  },
];

function Rules() {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            color: "#ffffff",
            marginBottom: "6px",
          }}
        >
          📖 Rules & Spin Payouts
        </h1>

        <p
          style={{
            color: "#8b949e",
            marginTop: 0,
          }}
        >
          Weekend game rules and spin payouts
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #f2cc60",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            color: "#f2cc60",
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          🎡 Spin Rules
        </h2>

        <SpinRule
          amount=".5, 1 & 1.5 Spins"
          text="You get a single spin multiplied by your spin amount."
        />

        <SpinRule
          amount="2 Spins"
          text="First Spin - Decide to keep your number with a 2x multiplier or spin a second time. Before you spin the second time, you need to say if you want to add your two numbers or multiply the second number by 2x. If you choose to spin a 2nd time, you can no longer multiply the first number by 2x."
        />

        <SpinRule
          amount="2.5 Spins"
          text="The same logic as a double spin applies. If you choose to add, you decide before the 2nd spin which spin gets the 1.5x multiplier."
        />

        <SpinRule
          amount="3 Spins"
          sections={[
            {
              label: "Multiplying",
              text:
                "Decide to keep your first spin number with a 3x multiplier or keep spinning. If you choose to spin a 2nd time, you can no longer multiply the first number by 3x. You can multiply the second number by 3x or roll a 3rd time and that 3rd number is automatically multiplied 3x.",
            },
            {
              label: "Adding",
              text:
                "After your first roll, if you decide to Add, then before your second roll, you can decide to apply a multiplier of 1x or 2x to the first spin. If you choose 2x for the first spin then the next spin is automatically a 1x and the total is added. If you choose 1x for the first spin, then after your second spin, you can decide if the second spin will be a 1x or 2x multiplier and if 1x is chosen again then you get a 3rd 1x spin and all 3 are added. You can also choose two 1.5x spins after your first roll.",
            },
          ]}
        />

        <SpinRule
          amount="3.5 Spins"
          text="Same logic as 3 spins, but before the 2nd or 3rd spin, decide which spin is getting more than the 1x multiplier(s) that add to 3.5. You still only get 3 total spins."
          last
        />
      </div>

      <h2
        style={{
          color: "#ffffff",
          marginBottom: "16px",
        }}
      >
        🎯 Game Rules
      </h2>

      <div
        style={{
          display: "grid",
          gap: "14px",
        }}
      >
        {gameRules.map((gameRule) => {
          const gameInfo =
            games.find(
              (game) =>
                game.name === gameRule.name
            );

          return (
            <GameRuleCard
              key={gameRule.name}
              game={{
                ...gameRule,
                icon:
                  gameInfo?.icon || "🎯",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function SpinRule({
  amount,
  text,
  sections,
  last = false,
}) {
  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: last
          ? "none"
          : "1px solid #30363d",
      }}
    >
      <strong
        style={{
          display: "block",
          color: "#ffffff",
          marginBottom: "7px",
          fontSize: "15px",
        }}
      >
        {amount}
      </strong>

      {text && (
        <span
          style={{
            display: "block",
            color: "#c9d1d9",
            lineHeight: 1.55,
            fontSize: "14px",
          }}
        >
          {text}
        </span>
      )}

      {sections &&
        sections.map((section, index) => (
          <div
            key={section.label}
            style={{
              marginTop:
                index === 0 ? "4px" : "14px",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#f2cc60",
                fontSize: "13px",
                marginBottom: "5px",
              }}
            >
              {section.label}
            </strong>

            <span
              style={{
                display: "block",
                color: "#c9d1d9",
                lineHeight: 1.55,
                fontSize: "14px",
              }}
            >
              {section.text}
            </span>
          </div>
        ))}
    </div>
  );
}

function GameRuleCard({ game }) {
  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          backgroundColor: "#21262d",
          padding: "14px 16px",
          borderBottom: "1px solid #30363d",
          textAlign: "center",
        }}
      >
        <strong
          style={{
            color: "#ffffff",
            fontSize: "17px",
          }}
        >
          {game.icon} {game.name}
        </strong>
      </div>

      <div
        style={{
          padding: "16px",
        }}
      >
        <div
          style={{
            marginBottom: game.rules
              ? "16px"
              : 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#f2cc60",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            🎡 Spin Payouts
          </div>

          <div
            style={{
              color: "#ffffff",
              fontSize: "14px",
              lineHeight: 1.55,
              whiteSpace: "pre-line",
            }}
          >
            {game.payouts}
          </div>
        </div>

        {game.rules && (
          <div
            style={{
              borderTop: "1px solid #30363d",
              paddingTop: "14px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#58a6ff",
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              📋 Rules
            </div>

            <div
              style={{
                color: "#c9d1d9",
                fontSize: "14px",
                lineHeight: 1.55,
              }}
            >
              {game.rules}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rules;