import { ethers } from "hardhat";
const { keccak256, defaultAbiCoder } = require("ethers");
import { expect } from "chai";
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("KashiApesMaker", function () {
  before(async function () {
    await prepare(this, ["ApesMakerKashi", "ApesBar", "ApesMakerKashiExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair", "BentoBoxV1", "KashiPairMediumRiskV1", "PeggedOracleV1"])
  })

  beforeEach(async function () {
    // Deploy ERC20 Mocks and Factory
    await deploy(this, [
      ["apes", this.ERC20Mock, ["Apes", "Apes", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    // Deploy Apes and Kashi contracts
    await deploy(this, [["bar", this.ApesBar, [this.apes.address]]])
    await deploy(this, [["bento", this.BentoBoxV1, [this.weth.address]]])
    await deploy(this, [["kashiMaster", this.KashiPairMediumRiskV1, [this.bento.address]]])
    await deploy(this, [["kashiMaker", this.ApesMakerKashi, [this.factory.address, this.bar.address, this.bento.address, this.apes.address, this.weth.address, this.factory.pairCodeHash()]]])
    await deploy(this, [["exploiter", this.ApesMakerKashiExploitMock, [this.kashiMaker.address]]])
    await deploy(this, [["oracle", this.PeggedOracleV1]])
    // Create SLPs
    await createSLP(this, "apesEth", this.apes, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "apesUSDC", this.apes, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
    // Set Kashi fees to Maker
    await this.kashiMaster.setFeeTo(this.kashiMaker.address)
    // Whitelist Kashi on Bento
    await this.bento.whitelistMasterContract(this.kashiMaster.address, true)
    // Approve and make Bento token deposits
    await this.apes.approve(this.bento.address, getBigNumber(10))
    await this.dai.approve(this.bento.address, getBigNumber(10))
    await this.mic.approve(this.bento.address, getBigNumber(10))
    await this.usdc.approve(this.bento.address, getBigNumber(10))
    await this.weth.approve(this.bento.address, getBigNumber(10))
    await this.strudel.approve(this.bento.address, getBigNumber(10))
    await this.bento.deposit(this.apes.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bento.deposit(this.dai.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bento.deposit(this.mic.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bento.deposit(this.usdc.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bento.deposit(this.weth.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bento.deposit(this.strudel.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    // Approve Kashi to spend 'alice' Bento tokens
    await this.bento.setMasterContractApproval(this.alice.address, this.kashiMaster.address, true, "0", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000")
    // **TO-DO - Initialize Kashi Pair**
    //const oracleData = await this.oracle.getDataParameter("1")
    //const initData = defaultAbiCoder.encode(["address", "address", "address", "bytes"], [this.apes.address, this.dai.address, this.oracle.address, oracleData])
    //await this.bento.deploy(this.KashiMaster.address, initData, true)
  })

  describe("setBridge", function () {
    it("only allows the owner to set bridge", async function () {
      await expect(this.kashiMaker.connect(this.bob).setBridge(this.apes.address, this.weth.address, { from: this.bob.address })).to.be.revertedWith("Ownable: caller is not the owner")
    })
    
    it("does not allow to set bridge for Apes", async function () {
      await expect(this.kashiMaker.setBridge(this.apes.address, this.weth.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.kashiMaker.setBridge(this.weth.address, this.apes.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.kashiMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("Maker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.kashiMaker.setBridge(this.dai.address, this.apes.address))
        .to.emit(this.kashiMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.apes.address)
    })
  })
  
  describe("convert", function () {
    it("reverts if caller is not EOA", async function () {
      await expect(this.exploiter.convert(this.apes.address)).to.be.revertedWith("Maker: Must use EOA")
    })
  })
})
