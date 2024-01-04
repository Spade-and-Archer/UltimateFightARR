
const indexerInfoByID = {};

export async function getIndexerInfo(indexerID: number){
    if(indexerInfoByID[indexerID]){
        return {...indexerInfoByID[indexerID]};
    }
    let response =  await fetch(`${process.env.PROWLARR_BASE_URL}/api/v1/indexer/${indexerID}`, {
        method: "GET",
        headers: {
            "X-Api-Key" : process.env.PROWLARR_KEY,
            "Content-Type": "application/json",
        },
    })
    try{

        if(response.status === 200){
            indexerInfoByID[indexerID] = await response.json();
            return {...indexerInfoByID[indexerID]};
        }
    }catch(e){
        console.warn("error parsing indexer info from prowlarr.")
        console.warn(e)
        throw new Error("Error parsing indexer info from prowlarr.")
    }

    console.warn(`Error: Prowlarr responded to indexer info request with ${response.status}`)
    throw new Error(`Error: Prowlarr responded to indexer info request with ${response.status}`)
}