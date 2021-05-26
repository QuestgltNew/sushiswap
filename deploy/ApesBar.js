module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const apes = await deployments.get("ApesToken")

  await deploy("ApesBar", {
    from: deployer,
    args: [apes.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["ApesBar"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "ApesToken"]
