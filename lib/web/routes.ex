defmodule Bonfire.Reticulum.Web.Routes do
  @behaviour Bonfire.UI.Common.RoutesModule

  defmacro __using__(_) do
    quote do
      scope "/" do
        pipe_through(:browser)
        pipe_through(:user_required)
        live("/messages/mesh", Bonfire.Reticulum.Web.MeshLive)
      end
    end
  end
end
