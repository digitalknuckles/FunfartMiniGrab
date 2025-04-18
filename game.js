// === Contract Setup ===
const CONTRACT_ADDRESS = "0x7eFC729a41FC7073dE028712b0FB3950F735f9ca";
const CONTRACT_ABI = ["function mintPrize() public"];
const INFURA_PROJECT_ID = "15da3c431a74b29edb63198a503d45b5";

const web3Modal = new window.Web3Modal.default({
  cacheProvider: true,
  providerOptions: {
    injected: {
      display: {
        name: "MetaMask",
        description: "Connect with your browser wallet",
      },
      package: null,
    },
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        infuraId: INFURA_PROJECT_ID,
      },
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
    // Start Menu
    this.startMenu = this.add.image(400, 300, 'startMenu').setInteractive();
    this.startMenu.on('pointerdown', () => {
      this.startMenu.setVisible(false);
      this.startGame();
    });

    // Overlay (always visible, changes with movement)
    this.overlay = this.add.image(400, 300, 'overlay_idle').setDepth(10).setVisible(false);

    // Mouse movement
    this.input.on('pointermove', pointer => {
      if (!this.gameStarted || this.dropInProgress) return;
      this.claw.x = Phaser.Math.Clamp(pointer.x, 100, 700);
      if (pointer.x < 375) {
        this.overlay.setTexture('overlay_left');
      } else if (pointer.x > 425) {
        this.overlay.setTexture('overlay_right');
      } else {
        this.overlay.setTexture('overlay_idle');
      }
    });

    // Drop claw on click
    this.input.on('pointerdown', () => {
      if (!this.gameStarted || this.dropInProgress) return;
      this.dropInProgress = true;
      this.tweens.add({
        targets: this.claw,
        y: this.prize.y,
        duration: 600,
        onComplete: () => {
          const distance = Phaser.Math.Distance.Between(this.claw.x, this.claw.y, this.prize.x, this.prize.y);
          if (distance < 50) {
            this.prize.setVelocityY(-200);
            this.time.delayedCall(1000, () => this.showVictoryScreen());
          }
          this.tweens.add({
            targets: this.claw,
            y: this.clawOriginalY,
            duration: 600,
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
    this.clawOriginalY = this.claw.y;

    this.prize = this.physics.add.sprite(Phaser.Math.Between(150, 650), 500, 'prize');
    this.prize.setBounce(0.3);
    this.prize.setCollideWorldBounds(true);

    this.overlay.setVisible(true);
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
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [GameScene],
};

new Phaser.Game(config);
