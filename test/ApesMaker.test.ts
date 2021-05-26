import { expect } from "chai";
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("ApesMaker", function () {
  before(async function () {
    await prepare(this, ["ApesMaker", "ApesBar", "ApesMakerExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["apes", this.ERC20Mock, ["Apes", "Apes", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    await deploy(this, [["bar", this.ApesBar, [this.apes.address]]])
    await deploy(this, [["apesMaker", this.ApesMaker, [this.factory.address, this.bar.address, this.apes.address, this.weth.address]]])
    await deploy(this, [["exploiter", this.ApesMakerExploitMock, [this.apesMaker.address]]])
    await createSLP(this, "apesEth", this.apes, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "apesUSDC", this.apes, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for Apes", async function () {
      await expect(this.apesMaker.setBridge(this.apes.address, this.weth.address)).to.be.revertedWith("ApesMaker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.apesMaker.setBridge(this.weth.address, this.apes.address)).to.be.revertedWith("ApesMaker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.apesMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("ApesMaker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.apesMaker.setBridge(this.dai.address, this.apes.address))
        .to.emit(this.apesMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.apes.address)
    })
  })
  describe("convert", function () {
    it("should convert Apes - ETH", async function () {
      await this.apesEth.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesMaker.convert(this.apes.address, this.weth.address)
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apesEth.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apes.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesMaker.convert(this.usdc.address, this.weth.address)
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apes.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesMaker.convert(this.strudel.address, this.weth.address)
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apes.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - Apes", async function () {
      await this.apesUSDC.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesMaker.convert(this.usdc.address, this.apes.address)
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apesUSDC.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apes.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesMaker.convert(this.dai.address, this.weth.address)
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apes.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesMaker.setBridge(this.usdc.address, this.apes.address)
      await this.apesMaker.setBridge(this.mic.address, this.usdc.address)
      await this.apesMaker.convert(this.mic.address, this.usdc.address)
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apes.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesMaker.setBridge(this.usdc.address, this.apes.address)
      await this.apesMaker.setBridge(this.dai.address, this.usdc.address)
      await this.apesMaker.convert(this.dai.address, this.usdc.address)
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apes.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesMaker.setBridge(this.dai.address, this.usdc.address)
      await this.apesMaker.setBridge(this.mic.address, this.dai.address)
      await this.apesMaker.convert(this.dai.address, this.mic.address)
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apes.balanceOf(this.bar.address)).to.equal("1200963016721363748")
    })

    // it("reverts if it loops back", async function () {
    //   await this.daiMIC.transfer(this.apesMaker.address, getBigNumber(1))
    //   await this.apesMaker.setBridge(this.dai.address, this.mic.address)
    //   await this.Maker.setBridge(this.mic.address, this.dai.address)
    //   await expect(this.apesMaker.convert(this.dai.address, this.mic.address)).to.be.reverted
    // })

    it("reverts if caller is not EOA", async function () {
      await this.apesEth.transfer(this.apesMaker.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.apes.address, this.weth.address)).to.be.revertedWith("ApesMaker: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.apesMaker.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("ApesMaker: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.apesMaker.address, getBigNumber(1))
      await expect(this.apesMaker.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("ApesMaker: Cannot convert")
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.apesMaker.address)).to.equal(getBigNumber(1))
      expect(await this.apes.balanceOf(this.bar.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesEth.transfer(this.apesMaker.address, getBigNumber(1))
      await this.apesMaker.convertMultiple([this.dai.address, this.apes.address], [this.weth.address, this.weth.address])
      expect(await this.apes.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.apesMaker.address)).to.equal(0)
      expect(await this.apes.balanceOf(this.bar.address)).to.equal("3186583558687783097")
    })
  })
})
