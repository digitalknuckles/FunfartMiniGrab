// === Contract Setup === 
const CONTRACT_ADDRESS = "0x7eFC729a41FC7073dE028712b0FB3950F735f9ca";
const CONTRACT_ABI = ["function mintPrize() public"];
const INFURA_PROJECT_ID = "15da3c431a74b29edb63198a503d45b5";

const web3Modal = new window.Web3Modal.default({
  cacheProvider: true,
  providerOptions: {
    injected: {
      display: { name: "MetaMask", description: "Connect with your browser wallet" },
      package: null,
    },
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: { infuraId: INFURA_PROJECT_ID },
    },
  },
});

async function connectWallet() {
  try {
    const provider = await web3Modal.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const signer = web3Provider.getSigner();
    return { web3Provider, signer };
  } catch (err) {
    alert("Wallet connection failed.");
    return null;
  }
}

async function mintPrizeNFT() {
  const wallet = await connectWallet();
  if (!wallet) return;
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet.signer);
    const tx = await contract.mintPrize();
    await tx.wait();
    alert("🎉 NFT Minted Successfully!");
  } catch (err) {
    alert("Minting failed: " + (err.reason || err.message));
  }
}

document.addEventListener("gameVictory", () => {
  mintPrizeNFT();
});

// === Phaser Game Scene ===
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.dropInProgress = false;
    this.gameStarted = false;
    this.prizeGrabbed = false;
    this.prizeDropped = false;
    this.activePrize = null;
  }

  preload() {
    this.load.image('background', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafybeic345u2ts5tz3u3xcguldwnlg3ye5wzl6o6vew7gnf6mh3du3xpnu');
    this.load.image('claw', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreicph5dqmvlsxvn7kbpd3ipf3qaul7sunbm3zhbx5tvf3ofgecljsq');
    this.load.image('prize', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreibyehv3juhhr7jgfblaziguedekj7skpqzndbbvd7xnj7isuxhela');
    this.load.image('victoryBg', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafybeie5fzzrljnlnejrhmrqaog3z4edm5hmsncuk4kayj5zyh7edfso5q');
    this.load.image('overlay_idle', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreie32rhyvbibeer5minlpijbri5puqq36bafszwyjnhc4ozakew3oy');
    this.load.image('overlay_left', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreig6zkwf6swgewwmwdhuiaualqymbfpbsdc4v3j3m47syg26x3uclq');
    this.load.image('overlay_right', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreichlj2x2l4ejoyxale7kbfmiszesglm2aftsbdnrchjy4br5q3n2e');
    this.load.image('startMenu', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreicexx7almk7jkzgd7up4uibqh2n7v6gkmeimbgoslbclc3dsndhhy');
  }

  create() {
    this.startMenu = this.add.image(400, 300, 'startMenu').setInteractive();
    this.startMenu.on('pointerdown', () => {
      this.startMenu.setVisible(false);
      this.startGame();
    });

    this.overlay = this.add.image(400, 300, 'overlay_idle').setDepth(10).setVisible(false);

    // Touch drag support
    this.input.on('pointermove', pointer => {
      if (!this.gameStarted || this.dropInProgress || this.prizeDropped) return;
      this.claw.x = Phaser.Math.Clamp(pointer.x, 100, 700);
      if (this.prizeGrabbed && this.activePrize) {
        this.activePrize.x = this.claw.x;
      }
      this.overlay.setTexture(pointer.x < 375 ? 'overlay_left' : pointer.x > 425 ? 'overlay_right' : 'overlay_idle');
    });

    this.input.on('pointerdown', () => {
      if (!this.gameStarted || this.dropInProgress) return;

      if (this.prizeGrabbed && this.activePrize && !this.prizeDropped) {
        this.releasePrize();
        return;
      }

      this.dropInProgress = true;

      this.tweens.add({
        targets: this.claw,
        y: this.deepestPrizeY - 40,
        duration: 600,
        onComplete: () => {
          this.physics.overlap(this.claw, this.prizes, (claw, prize) => {
            if (!this.prizeGrabbed) {
              this.activePrize = prize;
              this.prizeGrabbed = true;
              prize.body.allowGravity = false;
              prize.setVelocity(0);
              prize.y = this.claw.y + 40;
            }
          });

          this.tweens.add({
            targets: this.claw,
            y: this.clawOriginalY,
            duration: 600,
            onUpdate: () => {
              if (this.prizeGrabbed && this.activePrize) {
                this.activePrize.y = this.claw.y + 40;
              }
            },
            onComplete: () => {
              this.dropInProgress = false;
            }
          });
        }
      });
    });
  }

  startGame() {
    this.gameStarted = true;
    this.add.image(400, 300, 'background');

    this.claw = this.physics.add.sprite(400, 100, 'claw').setImmovable(true);
    this.claw.body.allowGravity = false;
    this.clawOriginalY = this.claw.y;

    this.prizes = this.physics.add.group();
    this.deepestPrizeY = 0;

    for (let i = 0; i < 4; i++) {
      const x = Phaser.Math.Between(120, 680);
      const y = Phaser.Math.Between(420, 500);
      const prize = this.prizes.create(x, y, 'prize');
      prize.setBounce(0.3);
      prize.setCollideWorldBounds(true);
      prize.body.allowGravity = true;
      if (y > this.deepestPrizeY) this.deepestPrizeY = y;
    }

    this.physics.add.collider(this.prizes, this.physics.world.bounds.bottom, (prize) => {
      if (this.prizeDropped && prize === this.activePrize) {
        this.time.delayedCall(500, () => this.showVictoryScreen());
        this.prizeDropped = false;
      }
    });

    this.overlay.setVisible(true);
  }

  releasePrize() {
    if (!this.activePrize) return;
    this.prizeDropped = true;
    this.prizeGrabbed = false;
    this.activePrize.body.allowGravity = true;
    this.activePrize.setVelocityY(300);
  }

  showVictoryScreen() {
    this.gameStarted = false;
    this.add.image(400, 300, 'victoryBg');
    this.add.text(400, 150, '🎉 You Win!', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);
    document.dispatchEvent(new Event("gameVictory"));
  }
}

// === Phaser Game Config ===
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [GameScene],
};

new Phaser.Game(config);
