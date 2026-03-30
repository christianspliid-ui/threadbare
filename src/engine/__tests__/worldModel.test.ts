/**
 * World Model Tests
 *
 * Validates that the consolidated world-model.json file contains all expected
 * categories, counts, and data integrity across all spheres, traditions, biomes, and edges.
 */

import { describe, it, expect } from "vitest";
import worldModel from "../../data/world-model.json";
import { WorldModel } from "../../types/worldModel";
import { TaxonomyNode, TaxonomyEdge } from "../../types/taxonomy";

// Type assertion to ensure worldModel is properly typed
const model = worldModel as unknown as WorldModel;

describe("World Model", () => {
  describe("Meta Section", () => {
    it("should have a meta object with version", () => {
      expect(model.meta).toBeDefined();
      expect(model.meta.version).toBe("1.0.0");
    });

    it("should have a generated timestamp", () => {
      expect(model.meta.generated).toBeDefined();
      expect(typeof model.meta.generated).toBe("string");
      // ISO 8601 format check
      expect(model.meta.generated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should have accurate node and edge counts", () => {
      expect(model.meta.nodeCount).toBe(model.nodes.length);
      expect(model.meta.edgeCount).toBe(model.edges.length);
    });

    it("should have categories array", () => {
      expect(Array.isArray(model.meta.categories)).toBe(true);
      expect(model.meta.categories.length).toBeGreaterThan(0);
    });

    it("should list all unique categories from nodes", () => {
      const uniqueCategories = new Set(model.nodes.map((n) => n.category));
      const expected = Array.from(uniqueCategories).sort();
      expect(model.meta.categories.sort()).toEqual(expected);
    });
  });

  describe("Creation Spheres", () => {
    it("should contain exactly 8 creation spheres", () => {
      const creationSpheres = model.nodes.filter(
        (n) => n.category === "creation-sphere"
      );
      expect(creationSpheres).toHaveLength(8);
    });

    it("should contain all expected creation sphere IDs", () => {
      const expected = [
        "creation.force",
        "creation.matter",
        "creation.energy",
        "creation.life",
        "creation.mind",
        "creation.spirit",
        "creation.time",
        "creation.entropy",
      ];
      const creationSpheres = model.nodes.filter(
        (n) => n.category === "creation-sphere"
      );
      const ids = creationSpheres.map((n) => n.id).sort();
      expect(ids).toEqual(expected.sort());
    });
  });

  describe("Foundation Spheres", () => {
    it("should contain at least 4 foundation spheres", () => {
      const foundationSpheres = model.nodes.filter(
        (n) => n.category === "foundation-sphere"
      );
      expect(foundationSpheres.length).toBeGreaterThanOrEqual(4);
    });

    it("should contain expected foundation spheres", () => {
      const expected = ["foundation.chaos", "foundation.darkness", "foundation.light", "foundation.shadow"];
      const foundationSpheres = model.nodes.filter(
        (n) => n.category === "foundation-sphere"
      );
      const ids = foundationSpheres.map((n) => n.id);
      for (const id of expected) {
        expect(ids).toContain(id);
      }
    });
  });

  describe("Magic Traditions", () => {
    it("should contain magic traditions", () => {
      const traditions = model.nodes.filter(
        (n) => n.category === "magic-tradition"
      );
      expect(traditions.length).toBeGreaterThan(0);
    });

    it("should contain many magic traditions (at least 20)", () => {
      const traditions = model.nodes.filter(
        (n) => n.category === "magic-tradition"
      );
      expect(traditions.length).toBeGreaterThanOrEqual(20);
    });

    it("should contain specific traditions like Fire Magic and Air Magic", () => {
      const traditions = model.nodes.filter(
        (n) => n.category === "magic-tradition"
      );
      const ids = traditions.map((n) => n.id);
      expect(ids).toContain("magic.fire");
      expect(ids).toContain("magic.air");
    });
  });

  describe("Terrain Biomes", () => {
    it("should contain terrain biomes", () => {
      const biomes = model.nodes.filter((n) => n.category === "terrain");
      expect(biomes.length).toBeGreaterThan(0);
    });

    it("should contain expected biome types", () => {
      const biomes = model.nodes.filter((n) => n.category === "terrain");
      const ids = biomes.map((n) => n.id);
      expect(ids).toContain("terrain.ocean");
      expect(ids).toContain("terrain.mountains");
      expect(ids).toContain("terrain.desert");
    });
  });

  describe("Relationship Types", () => {
    it("should contain relationship type nodes", () => {
      const relTypes = model.nodes.filter(
        (n) => n.category === "relationship-type"
      );
      expect(relTypes.length).toBeGreaterThan(0);
    });

    it("should contain expected relationship types", () => {
      const relTypes = model.nodes.filter(
        (n) => n.category === "relationship-type"
      );
      const ids = relTypes.map((n) => n.id);
      expect(ids).toContain("rel.underpins");
      expect(ids).toContain("rel.opposes");
      expect(ids).toContain("rel.generates");
      expect(ids).toContain("rel.biome-affinity");
    });
  });

  describe("Edges", () => {
    it("should contain edges", () => {
      expect(model.edges.length).toBeGreaterThan(0);
    });

    it("should have required edge properties", () => {
      for (const edge of model.edges.slice(0, 10)) {
        expect(edge.source).toBeDefined();
        expect(edge.target).toBeDefined();
        expect(edge.type).toBeDefined();
      }
    });

    it("should spot-check Force→Air Magic edge", () => {
      const forceAirEdge = model.edges.find(
        (e) =>
          e.source === "creation.force" &&
          e.target === "magic.air" &&
          e.type === "rel.generates"
      );
      expect(forceAirEdge).toBeDefined();
      expect(forceAirEdge?.weight).toBe(1.0);
    });

    it("should have edges with valid sources and targets", () => {
      const nodeIds = new Set(model.nodes.map((n) => n.id));
      for (const edge of model.edges) {
        expect(nodeIds.has(edge.source)).toBe(
          true,
          `Edge source "${edge.source}" not found in nodes`
        );
        expect(nodeIds.has(edge.target)).toBe(
          true,
          `Edge target "${edge.target}" not found in nodes`
        );
      }
    });

    it("should have edge types that reference existing relationship-type nodes", () => {
      const relTypeIds = new Set(
        model.nodes
          .filter((n) => n.category === "relationship-type")
          .map((n) => n.id)
      );
      for (const edge of model.edges) {
        expect(relTypeIds.has(edge.type)).toBe(
          true,
          `Edge type "${edge.type}" not found in relationship types`
        );
      }
    });
  });

  describe("Data Integrity", () => {
    it("should have no duplicate node IDs", () => {
      const ids = model.nodes.map((n) => n.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("should have all nodes with required properties", () => {
      for (const node of model.nodes) {
        expect(node.id).toBeDefined();
        expect(typeof node.id).toBe("string");
        expect(node.id.length).toBeGreaterThan(0);

        expect(node.name).toBeDefined();
        expect(typeof node.name).toBe("string");
        expect(node.name.length).toBeGreaterThan(0);

        expect(node.category).toBeDefined();
        expect(typeof node.category).toBe("string");

        expect(node.description).toBeDefined();
        expect(typeof node.description).toBe("string");

        expect(node.properties).toBeDefined();
        expect(typeof node.properties).toBe("object");
      }
    });

    it("should have all edges with required properties", () => {
      for (const edge of model.edges) {
        expect(edge.source).toBeDefined();
        expect(typeof edge.source).toBe("string");
        expect(edge.source.length).toBeGreaterThan(0);

        expect(edge.target).toBeDefined();
        expect(typeof edge.target).toBe("string");
        expect(edge.target.length).toBeGreaterThan(0);

        expect(edge.type).toBeDefined();
        expect(typeof edge.type).toBe("string");
        expect(edge.type.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Reaches", () => {
    it("should contain all 9 reaches", () => {
      const reaches = model.nodes.filter((n) => n.category === "reach");
      expect(reaches).toHaveLength(9);
      const names = reaches.map((n) => n.name);
      expect(names).toContain("Iron");
      expect(names).toContain("Gold");
      expect(names).toContain("Shadow");
      expect(names).toContain("Veil");
      expect(names).toContain("Heart");
      expect(names).toContain("Eye");
      expect(names).toContain("Stone");
      expect(names).toContain("Star");
      expect(names).toContain("Flesh");
    });

    it("reaches should have sphereAlignment property", () => {
      const reaches = model.nodes.filter((n) => n.category === "reach");
      for (const reach of reaches) {
        expect(reach.properties.sphereAlignment).toBeDefined();
        expect(typeof reach.properties.sphereAlignment).toBe("string");
      }
    });

    it("reaches should have aligned-with edges to spheres", () => {
      const aligned = model.edges.filter((e) => e.type === "rel.aligned-with");
      expect(aligned.length).toBeGreaterThanOrEqual(9);

      // Check that each reach has at least one aligned-with edge
      const reaches = model.nodes.filter((n) => n.category === "reach");
      for (const reach of reaches) {
        const hasAlignment = aligned.some((e) => e.source === reach.id);
        expect(hasAlignment).toBe(true, `Reach ${reach.id} should have at least one aligned-with edge`);
      }
    });
  });

  describe("Traits", () => {
    it("should contain trait nodes for all 6 categories", () => {
      const traitCategories = [
        "trait-innate",
        "trait-mastery",
        "trait-reputation",
        "trait-scar",
        "trait-condition",
        "trait-destiny",
      ];
      for (const cat of traitCategories) {
        const nodes = model.nodes.filter((n) => n.category === cat);
        expect(nodes.length).toBeGreaterThan(0, `Should have trait nodes in ${cat}`);
      }
    });

    it("should have at least 40 trait nodes", () => {
      const traitNodes = model.nodes.filter((n) =>
        n.category.startsWith("trait-")
      );
      expect(traitNodes.length).toBeGreaterThanOrEqual(40);
    });

    it("trait nodes should have required properties", () => {
      const dragonborn = model.nodes.find((n) => n.id === "trait.innate.dragonborn");
      expect(dragonborn).toBeDefined();
      expect(dragonborn!.properties.traitCategory).toBe("innate");
      expect(dragonborn!.properties.validNodes).toBeDefined();
      expect(Array.isArray(dragonborn!.properties.validNodes)).toBe(true);
      expect(dragonborn!.properties.effects).toBeDefined();
      expect(dragonborn!.properties.maxLevel).toBeDefined();
      expect(dragonborn!.properties.visibility).toBeDefined();
    });

    it("trait-to-reach boost edges should exist", () => {
      const boostEdges = model.edges.filter((e) => e.type === "rel.boosts");
      expect(boostEdges.length).toBeGreaterThan(0);

      // Spot check: Dragonborn should boost Iron and Veil
      const dragonbornBoosts = boostEdges.filter((e) => e.source === "trait.innate.dragonborn");
      expect(dragonbornBoosts.some((e) => e.target === "reach.iron")).toBe(true);
      expect(dragonbornBoosts.some((e) => e.target === "reach.veil")).toBe(true);
    });

    it("traits should reference valid actor types in validNodes", () => {
      const actorTypeIds = new Set(
        model.nodes
          .filter((n) => n.category === "actor-type")
          .map((n) => n.id)
      );

      const traitNodes = model.nodes.filter((n) => n.category.startsWith("trait-"));
      for (const trait of traitNodes) {
        const validNodes = trait.properties.validNodes;
        if (Array.isArray(validNodes)) {
          for (const nodeRef of validNodes) {
            // Allow 'any' and 'any_with_population' as special wildcards
            if (nodeRef !== "any" && nodeRef !== "any_with_population") {
              expect(actorTypeIds.has(nodeRef)).toBe(
                true,
                `Trait ${trait.id} references invalid actor type ${nodeRef}`
              );
            }
          }
        }
      }
    });
  });

  describe("Action Templates", () => {
    it("should contain action templates", () => {
      const actions = model.nodes.filter((n) => n.category === "action-template");
      expect(actions.length).toBeGreaterThanOrEqual(36); // 4 per reach * 9 reaches
      expect(actions).toHaveLength(36); // Exactly 36
    });

    it("action templates should have crudType", () => {
      const actions = model.nodes.filter((n) => n.category === "action-template");
      for (const action of actions) {
        expect(action.properties.crudType).toBeDefined();
        expect(["CREATE", "READ", "UPDATE", "DELETE"]).toContain(
          action.properties.crudType
        );
      }
    });

    it("action templates should have reach property", () => {
      const actions = model.nodes.filter((n) => n.category === "action-template");
      for (const action of actions) {
        expect(action.properties.reach).toBeDefined();
        expect(action.properties.reach.startsWith("reach.")).toBe(true);
      }
    });

    it("should have one CREATE, READ, UPDATE, DELETE action per reach", () => {
      const actions = model.nodes.filter((n) => n.category === "action-template");
      const reaches = model.nodes.filter((n) => n.category === "reach");

      for (const reach of reaches) {
        const reachActions = actions.filter(
          (a) => a.properties.reach === reach.id
        );
        const cruds = new Set(reachActions.map((a) => a.properties.crudType));
        expect(cruds.has("CREATE")).toBe(true, `No CREATE action for ${reach.id}`);
        expect(cruds.has("READ")).toBe(true, `No READ action for ${reach.id}`);
        expect(cruds.has("UPDATE")).toBe(true, `No UPDATE action for ${reach.id}`);
        expect(cruds.has("DELETE")).toBe(true, `No DELETE action for ${reach.id}`);
      }
    });

    it("action templates should have belongs-to edges to reaches", () => {
      const belongsTo = model.edges.filter((e) => e.type === "rel.belongs-to");
      expect(belongsTo.length).toBeGreaterThanOrEqual(36);

      // Every action should have a belongs-to edge to its reach
      const actions = model.nodes.filter((n) => n.category === "action-template");
      for (const action of actions) {
        const belongsEdge = belongsTo.find((e) =>
          e.source === action.id && e.target === action.properties.reach
        );
        expect(belongsEdge).toBeDefined(
          `Action ${action.id} should have belongs-to edge to ${action.properties.reach}`
        );
      }
    });
  });

  describe("Actor Types", () => {
    it("should contain actor types", () => {
      const actors = model.nodes.filter((n) => n.category === "actor-type");
      expect(actors.length).toBeGreaterThanOrEqual(4);
      const names = actors.map((n) => n.name);
      expect(names).toContain("Individual");
      expect(names).toContain("God");
      expect(names).toContain("Ascendant");
      expect(names).toContain("Faction");
      expect(names).toContain("Culture");
      expect(names).toContain("Group");
    });

    it("actor types should have tier property", () => {
      const actors = model.nodes.filter((n) => n.category === "actor-type");
      for (const actor of actors) {
        expect(actor.properties.tier).toBeDefined();
        expect(typeof actor.properties.tier).toBe("string");
      }
    });

    it("actor types should have maslowLayers property", () => {
      const actors = model.nodes.filter((n) => n.category === "actor-type");
      for (const actor of actors) {
        expect(actor.properties.maslowLayers).toBeDefined();
        expect(Array.isArray(actor.properties.maslowLayers)).toBe(true);
        expect(actor.properties.maslowLayers.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Location Types", () => {
    it("should contain region, location, and sublocation type nodes", () => {
      const regions = model.nodes.filter((n) => n.category === "region-type");
      expect(regions.length).toBeGreaterThan(0);
      expect(regions.length).toBeGreaterThanOrEqual(5);

      const locations = model.nodes.filter((n) => n.category === "location-type");
      expect(locations.length).toBeGreaterThan(0);
      expect(locations.length).toBeGreaterThanOrEqual(7);

      const sublocations = model.nodes.filter((n) => n.category === "sublocation-type");
      expect(sublocations.length).toBeGreaterThan(0);
      expect(sublocations.length).toBeGreaterThanOrEqual(7);
    });

    it("location types should have terrain-valid edges", () => {
      const terrainValid = model.edges.filter((e) => e.type === "rel.terrain-valid");
      expect(terrainValid.length).toBeGreaterThan(0);

      // Spot check: settlement should be valid on grassland, farmland, coastal
      const settlementTerrain = terrainValid.filter(
        (e) => e.source === "location.settlement"
      );
      expect(settlementTerrain.length).toBeGreaterThan(0);
    });

    it("should contain contains-type edges for location hierarchy", () => {
      const containsType = model.edges.filter((e) => e.type === "rel.contains-type");
      expect(containsType.length).toBeGreaterThan(0);

      // Spot check: kingdom should contain settlement
      const kingdomContains = containsType.find(
        (e) => e.source === "region.kingdom" && e.target === "location.settlement"
      );
      expect(kingdomContains).toBeDefined();
    });

    it("location type nodes should have valid categories", () => {
      const regionTypes = new Set(
        model.nodes
          .filter((n) => n.category === "region-type")
          .map((n) => n.id)
      );
      const locTypes = new Set(
        model.nodes
          .filter((n) => n.category === "location-type")
          .map((n) => n.id)
      );
      const sublocTypes = new Set(
        model.nodes
          .filter((n) => n.category === "sublocation-type")
          .map((n) => n.id)
      );

      expect(regionTypes.has("region.kingdom")).toBe(true);
      expect(locTypes.has("location.settlement")).toBe(true);
      expect(sublocTypes.has("sublocation.market-district")).toBe(true);
    });
  });

  describe("Cultures", () => {
    it("should contain culture nodes", () => {
      const cultures = model.nodes.filter((n) => n.category === "culture");
      expect(cultures.length).toBeGreaterThan(0);
      expect(cultures.length).toBeGreaterThanOrEqual(4);

      const ids = cultures.map((n) => n.id);
      expect(ids).toContain("culture.dwarven-holds");
      expect(ids).toContain("culture.nomad-clans");
      expect(ids).toContain("culture.tidal-elves");
      expect(ids).toContain("culture.ember-kingdoms");
    });

    it("cultures should have dominantBeliefs and knowledgeTraditions properties", () => {
      const cultures = model.nodes.filter((n) => n.category === "culture");
      for (const culture of cultures) {
        expect(culture.properties.dominantBeliefs).toBeDefined();
        expect(Array.isArray(culture.properties.dominantBeliefs)).toBe(true);
        expect(culture.properties.knowledgeTraditions).toBeDefined();
        expect(Array.isArray(culture.properties.knowledgeTraditions)).toBe(true);
      }
    });

    it("cultures should have favors edges to reaches", () => {
      const favors = model.edges.filter((e) => e.type === "rel.favors");
      expect(favors.length).toBeGreaterThan(0);

      // Spot check: dwarven-holds should favor gold and stone
      const dwarvenFavors = favors.filter(
        (e) => e.source === "culture.dwarven-holds"
      );
      expect(dwarvenFavors.some((e) => e.target === "reach.gold")).toBe(true);
      expect(dwarvenFavors.some((e) => e.target === "reach.stone")).toBe(true);
    });

    it("cultures should have venerates edges to spheres", () => {
      const venerates = model.edges.filter((e) => e.type === "rel.venerates");
      expect(venerates.length).toBeGreaterThan(0);

      // Spot check: dwarven-holds should venerate matter
      const dwarvenVenerates = venerates.find(
        (e) => e.source === "culture.dwarven-holds" && e.target === "creation.matter"
      );
      expect(dwarvenVenerates).toBeDefined();
    });
  });

  describe("New Relationship Types", () => {
    it("should contain all new relationship type nodes", () => {
      const relTypes = model.nodes.filter(
        (n) => n.category === "relationship-type"
      );
      const ids = relTypes.map((n) => n.id);

      const newTypes = [
        "rel.boosts",
        "rel.valid-for",
        "rel.belongs-to",
        "rel.aligned-with",
        "rel.terrain-valid",
        "rel.contains-type",
        "rel.hosts",
        "rel.upgrades-to",
        "rel.practices",
        "rel.favors",
        "rel.venerates",
        "rel.inhabits",
      ];

      for (const type of newTypes) {
        expect(ids).toContain(type, `Missing relationship type ${type}`);
      }
    });

    it("new relationship types should have pattern and visualStyle properties", () => {
      const newTypeIds = [
        "rel.boosts",
        "rel.valid-for",
        "rel.belongs-to",
        "rel.aligned-with",
      ];

      for (const typeId of newTypeIds) {
        const relType = model.nodes.find((n) => n.id === typeId);
        expect(relType).toBeDefined();
        expect(relType!.properties.pattern).toBeDefined();
        expect(relType!.properties.visualStyle).toBeDefined();
      }
    });
  });

  describe("Integration: Edges Reference Valid Nodes", () => {
    it("all edges should reference existing nodes for new edge types", () => {
      const nodeIds = new Set(model.nodes.map((n) => n.id));

      const newEdgeTypes = [
        "rel.boosts",
        "rel.belongs-to",
        "rel.aligned-with",
        "rel.terrain-valid",
        "rel.contains-type",
        "rel.hosts",
        "rel.favors",
        "rel.venerates",
      ];

      for (const edgeType of newEdgeTypes) {
        const edges = model.edges.filter((e) => e.type === edgeType);
        for (const edge of edges) {
          expect(nodeIds.has(edge.source)).toBe(
            true,
            `Edge ${edgeType}: source "${edge.source}" not found`
          );
          expect(nodeIds.has(edge.target)).toBe(
            true,
            `Edge ${edgeType}: target "${edge.target}" not found`
          );
        }
      }
    });
  });
});
