defmodule Bonfire.Reticulum.Web.MeshLive do
  use Bonfire.UI.Common.Web, :surface_live_view

  on_mount {LivePlugs, [Bonfire.UI.Me.LivePlugs.LoadCurrentUser]}

  def mount(_params, _session, socket) do
    {:ok, assign(socket, page_title: l("Mesh"), page: "messages", back: true)}
  end
end
