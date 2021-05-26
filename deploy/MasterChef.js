module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const apes = await ethers.getContract("ApesToken")
  
  const { address } = await deploy("MasterChef", {
    from: deployer,
    args: [apes.address, dev, "1000000000000000000000", "0", "1000000000000000000000"],
    log: true,
    deterministicDeployment: false
  })

  if (await apes.owner() !== address) {
    // Transfer APES Ownership to Chef
    console.log("Transfer APES Ownership to Chef")
    await (await apes.transferOwnership(address)).wait()
  }

  const masterChef = await ethers.getContract("MasterChef")
  if (await masterChef.owner() !== dev) {
    // Transfer ownership of MasterChef to dev
    console.log("Transfer ownership of MasterChef to dev")
    await (await masterChef.transferOwnership(dev)).wait()
  }
}

module.exports.tags = ["MasterChef"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "ApesToken"]
