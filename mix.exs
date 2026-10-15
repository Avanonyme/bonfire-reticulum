defmodule Bonfire.Reticulum.MixProject do
  use Mix.Project

  def project do
    [app: :bonfire_reticulum, version: "0.1.0", elixir: "~> 1.15",
     deps: [{:bonfire_ui_common, git: "https://github.com/bonfire-networks/bonfire_ui_common"}]]
  end

  def application, do: [extra_applications: [:logger]]
end
