import { ipfs, json } from "@graphprotocol/graph-ts";
import { Owner, Witch } from "../generated/schema";
import { Transfer as TransferEvent } from "../generated/Token/Token";

const ipfsHash = "QmaXzZhcYnsisuue5WRdQDH6FDvqkLQX1NckLqBYeYYEfm";

export function handleTransfer(event: TransferEvent): void {
  let witch = Witch.load(event.params.tokenId.toString());

  if (!witch) {
    witch = new Witch(event.params.tokenId.toString());
    witch.witchID = event.params.tokenId;
    witch.witchURI = "/" + event.params.tokenId.toString() + ".json";

    let metadata = ipfs.cat(ipfsHash + witch.witchURI);
    if (metadata) {
      const value = json.fromBytes(metadata).toObject();
      if (value) {
        const image = value.get("image");
        const name = value.get("name");
        const description = value.get("description");
        const externalURL = value.get("external_url");
        if (image && name && description && externalURL) {
          witch.image = image.toString();
          witch.name = name.toString();
          witch.description = description.toString();
          witch.externalURL = externalURL.toString();
          witch.ipfsURI = "ipfs.io/ipfs/" + ipfsHash + witch.witchURI;
        }

        const coven = value.get("coven");
        if (coven) {
          let covenData = coven.toObject();
          const type = covenData.get("type");
          if (type) {
            witch.type = type.toString();
          }
          const birthChart = covenData.get("birthChart");
          if (birthChart) {
            const birthChartData = birthChart.toObject();
            const sun = birthChartData.get("sun");
            const moon = birthChartData.get("moon");
            const rising = birthChartData.get("rising");
            if (sun && moon && rising) {
              witch.sun = sun.toString();
              witch.moon = moon.toString();
              witch.rising = rising.toString();
            }
          }
        }
      }
    }
  }

  witch.updatedAtTimestamp = event.block.timestamp;
  witch.owner = event.params.to.toHexString();
  witch.save();

  let owner = Owner.load(event.params.to.toHexString());

  if (!owner) {
    owner = new Owner(event.params.to.toHexString());
    owner.save();
  }
}
