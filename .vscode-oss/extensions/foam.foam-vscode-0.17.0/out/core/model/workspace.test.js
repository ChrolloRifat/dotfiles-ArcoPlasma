"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workspace_1 = require("./workspace");
const graph_1 = require("./graph");
const log_1 = require("../utils/log");
const uri_1 = require("./uri");
const test_utils_1 = require("../../test/test-utils");
log_1.Logger.setLevel('error');
describe('Reference types', () => {
    it('Detects absolute references', () => {
        expect(workspace_1.getReferenceType('/hello')).toEqual('absolute-path');
        expect(workspace_1.getReferenceType('/hello/there')).toEqual('absolute-path');
    });
    it('Detects relative references', () => {
        expect(workspace_1.getReferenceType('../hello')).toEqual('relative-path');
        expect(workspace_1.getReferenceType('./hello')).toEqual('relative-path');
        expect(workspace_1.getReferenceType('./hello/there')).toEqual('relative-path');
    });
    it('Detects key references', () => {
        expect(workspace_1.getReferenceType('hello')).toEqual('key');
    });
    it('Detects URIs', () => {
        expect(workspace_1.getReferenceType(uri_1.URI.file('/path/to/file.md'))).toEqual('uri');
    });
});
describe('Workspace resources', () => {
    it('Adds notes to workspace', () => {
        const ws = test_utils_1.createTestWorkspace();
        ws.set(test_utils_1.createTestNote({ uri: '/page-a.md' }));
        ws.set(test_utils_1.createTestNote({ uri: '/page-b.md' }));
        ws.set(test_utils_1.createTestNote({ uri: '/page-c.md' }));
        expect(ws
            .list()
            .map(n => n.uri.path)
            .sort()).toEqual(['/page-a.md', '/page-b.md', '/page-c.md']);
    });
    it('Listing resources includes all notes', () => {
        const ws = test_utils_1.createTestWorkspace();
        ws.set(test_utils_1.createTestNote({ uri: '/page-a.md' }));
        ws.set(test_utils_1.createTestNote({ uri: '/file.pdf' }));
        expect(ws
            .list()
            .map(n => n.uri.path)
            .sort()).toEqual(['/file.pdf', '/page-a.md']);
    });
    it('Fails if getting non-existing note', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA);
        const uri = uri_1.URI.file('/path/to/another/page-b.md');
        expect(ws.exists(uri)).toBeFalsy();
        expect(ws.find(uri)).toBeNull();
        expect(() => ws.get(uri)).toThrow();
    });
    it('Should work with a resource named like a JS prototype property', () => {
        const ws = test_utils_1.createTestWorkspace();
        const noteA = test_utils_1.createTestNote({ uri: '/somewhere/constructor.md' });
        ws.set(noteA);
        expect(ws.list()).toEqual([noteA]);
    });
    it('#851 - listing by ID should not return files with same suffix', () => {
        const ws = test_utils_1.createTestWorkspace()
            .set(test_utils_1.createTestNote({ uri: 'test-file.md' }))
            .set(test_utils_1.createTestNote({ uri: 'file.md' }));
        expect(ws.listById('file').length).toEqual(1);
    });
    it('should include fragment when finding resource URI', () => {
        const ws = test_utils_1.createTestWorkspace()
            .set(test_utils_1.createTestNote({ uri: 'test-file.md' }))
            .set(test_utils_1.createTestNote({ uri: 'file.md' }));
        const res = ws.find('test-file#my-section');
        expect(res.uri.fragment).toEqual('my-section');
    });
});
describe('Graph', () => {
    it('contains notes and placeholders', () => {
        const ws = test_utils_1.createTestWorkspace();
        ws.set(test_utils_1.createTestNote({
            uri: '/page-a.md',
            links: [{ slug: 'placeholder-link' }],
        }));
        ws.set(test_utils_1.createTestNote({ uri: '/file.pdf' }));
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph
            .getAllNodes()
            .map(uri => uri.path)
            .sort()).toEqual(['/file.pdf', '/page-a.md', 'placeholder-link']);
    });
    it('Supports multiple connections between the same resources', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/note-a.md',
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/note-b.md',
            links: [{ to: noteA.uri.path }, { to: noteA.uri.path }],
        });
        const ws = test_utils_1.createTestWorkspace()
            .set(noteA)
            .set(noteB);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getBacklinks(noteA.uri)).toEqual([
            {
                source: noteB.uri,
                target: noteA.uri,
                link: expect.objectContaining({ type: 'link' }),
            },
            {
                source: noteB.uri,
                target: noteA.uri,
                link: expect.objectContaining({ type: 'link' }),
            },
        ]);
    });
    it('Supports removing a single link amongst several between two resources', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/note-a.md',
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/note-b.md',
            links: [{ to: noteA.uri.path }, { to: noteA.uri.path }],
        });
        const ws = test_utils_1.createTestWorkspace()
            .set(noteA)
            .set(noteB);
        const graph = graph_1.FoamGraph.fromWorkspace(ws, true);
        expect(graph.getBacklinks(noteA.uri).length).toEqual(2);
        const noteBBis = test_utils_1.createTestNote({
            uri: '/note-b.md',
            links: [{ to: noteA.uri.path }],
        });
        ws.set(noteBBis);
        expect(graph.getBacklinks(noteA.uri).length).toEqual(1);
        ws.dispose();
        graph.dispose();
    });
});
describe('Identifier computation', () => {
    it('should compute the minimum identifier to resolve a name clash', () => {
        const first = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
        });
        const second = test_utils_1.createTestNote({
            uri: '/another/way/for/page-a.md',
        });
        const third = test_utils_1.createTestNote({
            uri: '/another/path/for/page-a.md',
        });
        const ws = new workspace_1.FoamWorkspace()
            .set(first)
            .set(second)
            .set(third);
        expect(ws.getIdentifier(first.uri)).toEqual('to/page-a');
        expect(ws.getIdentifier(second.uri)).toEqual('way/for/page-a');
        expect(ws.getIdentifier(third.uri)).toEqual('path/for/page-a');
    });
    it('should support sections in identifier computation', () => {
        const first = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
        });
        const second = test_utils_1.createTestNote({
            uri: '/another/way/for/page-a.md',
        });
        const third = test_utils_1.createTestNote({
            uri: '/another/path/for/page-a.md',
        });
        const ws = new workspace_1.FoamWorkspace()
            .set(first)
            .set(second)
            .set(third);
        expect(ws.getIdentifier(uri_1.URI.withFragment(first.uri, 'section name'))).toEqual('to/page-a#section name');
    });
});
describe('Wikilinks', () => {
    it('Can be defined with basename, relative path, absolute path, extension', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [
                // wikilink
                { slug: 'page-b' },
                // relative path wikilink
                { slug: '../another/page-c.md' },
                // absolute path wikilink
                { slug: '/absolute/path/page-d' },
                // wikilink with extension
                { slug: 'page-e.md' },
                // wikilink to placeholder
                { slug: 'placeholder-test' },
            ],
        });
        const ws = test_utils_1.createTestWorkspace()
            .set(noteA)
            .set(test_utils_1.createTestNote({ uri: '/somewhere/page-b.md' }))
            .set(test_utils_1.createTestNote({ uri: '/path/another/page-c.md' }))
            .set(test_utils_1.createTestNote({ uri: '/absolute/path/page-d.md' }))
            .set(test_utils_1.createTestNote({ uri: '/absolute/path/page-e.md' }));
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph
            .getLinks(noteA.uri)
            .map(link => link.target.path)
            .sort()).toEqual([
            '/absolute/path/page-d.md',
            '/absolute/path/page-e.md',
            '/path/another/page-c.md',
            '/somewhere/page-b.md',
            'placeholder-test',
        ]);
    });
    it('Creates inbound connections for target note', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        const ws = test_utils_1.createTestWorkspace()
            .set(noteA)
            .set(test_utils_1.createTestNote({
            uri: '/somewhere/page-b.md',
            links: [{ slug: 'page-a' }],
        }))
            .set(test_utils_1.createTestNote({
            uri: '/path/another/page-c.md',
            links: [{ slug: '/path/to/page-a' }],
        }))
            .set(test_utils_1.createTestNote({
            uri: '/absolute/path/page-d.md',
            links: [{ slug: '../to/page-a.md' }],
        }));
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph
            .getBacklinks(noteA.uri)
            .map(link => link.source.path)
            .sort()).toEqual(['/path/another/page-c.md', '/somewhere/page-b.md']);
    });
    it('Uses wikilink definitions when available to resolve target', () => {
        const ws = test_utils_1.createTestWorkspace();
        const noteA = test_utils_1.createTestNote({
            uri: '/somewhere/from/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        noteA.definitions.push({
            label: 'page-b',
            url: '../to/page-b.md',
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/somewhere/to/page-b.md',
        });
        ws.set(noteA).set(noteB);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getAllConnections()[0]).toEqual({
            source: noteA.uri,
            target: noteB.uri,
            link: expect.objectContaining({ type: 'wikilink', label: 'page-b' }),
        });
    });
    it('Resolves wikilink referencing more than one note', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        const noteB1 = test_utils_1.createTestNote({ uri: '/path/to/another/page-b.md' });
        const noteB2 = test_utils_1.createTestNote({ uri: '/path/to/more/page-b.md' });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA)
            .set(noteB1)
            .set(noteB2);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri)).toEqual([
            {
                source: noteA.uri,
                target: noteB1.uri,
                link: expect.objectContaining({ type: 'wikilink' }),
            },
        ]);
    });
    it('Resolves path wikilink in case of name conflict', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: './more/page-b' }, { slug: 'yet/page-b' }],
        });
        const noteB1 = test_utils_1.createTestNote({ uri: '/path/to/another/page-b.md' });
        const noteB2 = test_utils_1.createTestNote({ uri: '/path/to/more/page-b.md' });
        const noteB3 = test_utils_1.createTestNote({ uri: '/path/to/yet/page-b.md' });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA)
            .set(noteB1)
            .set(noteB2)
            .set(noteB3);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([
            noteB2.uri,
            noteB3.uri,
        ]);
    });
    it('Supports attachments', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [
                // wikilink with extension
                { slug: 'attachment-a.pdf' },
                // wikilink without extension
                { slug: 'attachment-b' },
            ],
        });
        const attachmentA = test_utils_1.createTestNote({
            uri: '/path/to/more/attachment-a.pdf',
        });
        const attachmentB = test_utils_1.createTestNote({
            uri: '/path/to/more/attachment-b.pdf',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA)
            .set(attachmentA)
            .set(attachmentB);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getBacklinks(attachmentA.uri).map(l => l.source)).toEqual([
            noteA.uri,
        ]);
        // Attachments require extension
        expect(graph.getBacklinks(attachmentB.uri).map(l => l.source)).toEqual([]);
    });
    it('Resolves conflicts alphabetically - part 1', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'attachment-a.pdf' }],
        });
        const attachmentA = test_utils_1.createTestNote({
            uri: '/path/to/more/attachment-a.pdf',
        });
        const attachmentABis = test_utils_1.createTestNote({
            uri: '/path/to/attachment-a.pdf',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA)
            .set(attachmentA)
            .set(attachmentABis);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([
            attachmentABis.uri,
        ]);
    });
    it('Resolves conflicts alphabetically - part 2', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'attachment-a.pdf' }],
        });
        const attachmentA = test_utils_1.createTestNote({
            uri: '/path/to/more/attachment-a.pdf',
        });
        const attachmentABis = test_utils_1.createTestNote({
            uri: '/path/to/attachment-a.pdf',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA)
            .set(attachmentABis)
            .set(attachmentA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([
            attachmentABis.uri,
        ]);
    });
    it('Allows for dendron-style wikilinks, including a dot', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'dendron.style' }],
        });
        const noteB1 = test_utils_1.createTestNote({ uri: '/path/to/another/dendron.style.md' });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA).set(noteB1);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteB1.uri]);
    });
    it('Handles capitalization of files and wikilinks correctly', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [
                // uppercased filename, lowercased slug
                { slug: 'page-b' },
                // lowercased filename, camelcased wikilink
                { slug: 'Page-C' },
                // lowercased filename, lowercased wikilink
                { slug: 'page-d' },
            ],
        });
        const ws = test_utils_1.createTestWorkspace()
            .set(noteA)
            .set(test_utils_1.createTestNote({ uri: '/somewhere/PAGE-B.md' }))
            .set(test_utils_1.createTestNote({ uri: '/path/another/page-c.md' }))
            .set(test_utils_1.createTestNote({ uri: '/path/another/page-d.md' }));
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph
            .getLinks(noteA.uri)
            .map(link => link.target.path)
            .sort()).toEqual([
            '/path/another/page-c.md',
            '/path/another/page-d.md',
            '/somewhere/PAGE-B.md',
        ]);
    });
});
describe('markdown direct links', () => {
    it('Support absolute and relative path', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ to: './another/page-b.md' }, { to: 'more/page-c.md' }],
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
            links: [{ to: '../../to/page-a.md' }],
        });
        const noteC = test_utils_1.createTestNote({
            uri: '/path/to/more/page-c.md',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA)
            .set(noteB)
            .set(noteC);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph
            .getLinks(noteA.uri)
            .map(link => link.target.path)
            .sort()).toEqual(['/path/to/another/page-b.md', '/path/to/more/page-c.md']);
        expect(graph.getLinks(noteB.uri).map(l => l.target)).toEqual([noteA.uri]);
        expect(graph.getBacklinks(noteA.uri).map(l => l.source)).toEqual([
            noteB.uri,
        ]);
        expect(graph.getConnections(noteA.uri)).toEqual([
            {
                source: noteA.uri,
                target: noteB.uri,
                link: expect.objectContaining({ type: 'link' }),
            },
            {
                source: noteA.uri,
                target: noteC.uri,
                link: expect.objectContaining({ type: 'link' }),
            },
            {
                source: noteB.uri,
                target: noteA.uri,
                link: expect.objectContaining({ type: 'link' }),
            },
        ]);
    });
});
describe('Placeholders', () => {
    it('Treats direct links to non-existing files as placeholders', () => {
        const ws = test_utils_1.createTestWorkspace();
        const noteA = test_utils_1.createTestNote({
            uri: '/somewhere/from/page-a.md',
            links: [{ to: '../page-b.md' }, { to: '/path/to/page-c.md' }],
        });
        ws.set(noteA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getAllConnections()[0]).toEqual({
            source: noteA.uri,
            target: uri_1.URI.placeholder('/somewhere/page-b.md'),
            link: expect.objectContaining({ type: 'link' }),
        });
        expect(graph.getAllConnections()[1]).toEqual({
            source: noteA.uri,
            target: uri_1.URI.placeholder('/path/to/page-c.md'),
            link: expect.objectContaining({ type: 'link' }),
        });
    });
    it('Treats wikilinks without matching file as placeholders', () => {
        const ws = test_utils_1.createTestWorkspace();
        const noteA = test_utils_1.createTestNote({
            uri: '/somewhere/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        ws.set(noteA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getAllConnections()[0]).toEqual({
            source: noteA.uri,
            target: uri_1.URI.placeholder('page-b'),
            link: expect.objectContaining({ type: 'wikilink' }),
        });
    });
    it('Treats wikilink with definition to non-existing file as placeholders', () => {
        const ws = test_utils_1.createTestWorkspace();
        const noteA = test_utils_1.createTestNote({
            uri: '/somewhere/page-a.md',
            links: [{ slug: 'page-b' }, { slug: 'page-c' }],
        });
        noteA.definitions.push({
            label: 'page-b',
            url: './page-b.md',
        });
        noteA.definitions.push({
            label: 'page-c',
            url: '/path/to/page-c.md',
        });
        ws.set(noteA).set(test_utils_1.createTestNote({ uri: '/different/location/for/note-b.md' }));
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getAllConnections()[0]).toEqual({
            source: noteA.uri,
            target: uri_1.URI.placeholder('/somewhere/page-b.md'),
            link: expect.objectContaining({ type: 'wikilink' }),
        });
        expect(graph.getAllConnections()[1]).toEqual({
            source: noteA.uri,
            target: uri_1.URI.placeholder('/path/to/page-c.md'),
            link: expect.objectContaining({ type: 'wikilink' }),
        });
    });
    it('Should work with a placeholder named like a JS prototype property', () => {
        const ws = test_utils_1.createTestWorkspace();
        const noteA = test_utils_1.createTestNote({
            uri: '/page-a.md',
            links: [{ slug: 'constructor' }],
        });
        ws.set(noteA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph
            .getAllNodes()
            .map(uri => uri.path)
            .sort()).toEqual(['/page-a.md', 'constructor']);
    });
});
describe('Updating workspace happy path', () => {
    it('Update links when modifying note', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
            links: [{ slug: 'page-c' }],
        });
        const noteC = test_utils_1.createTestNote({
            uri: '/path/to/more/page-c.md',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA)
            .set(noteB)
            .set(noteC);
        let graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteB.uri]);
        expect(graph.getBacklinks(noteB.uri).map(l => l.source)).toEqual([
            noteA.uri,
        ]);
        expect(graph.getBacklinks(noteC.uri).map(l => l.source)).toEqual([
            noteB.uri,
        ]);
        // update the note
        const noteABis = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-c' }],
        });
        ws.set(noteABis);
        // change is not propagated immediately
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteB.uri]);
        expect(graph.getBacklinks(noteB.uri).map(l => l.source)).toEqual([
            noteA.uri,
        ]);
        expect(graph.getBacklinks(noteC.uri).map(l => l.source)).toEqual([
            noteB.uri,
        ]);
        // recompute the links
        graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteC.uri]);
        expect(graph.getBacklinks(noteB.uri).map(l => l.source)).toEqual([]);
        expect(graph
            .getBacklinks(noteC.uri)
            .map(link => link.source.path)
            .sort()).toEqual(['/path/to/another/page-b.md', '/path/to/page-a.md']);
    });
    it('Removing target note should produce placeholder for wikilinks', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA).set(noteB);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteB.uri]);
        expect(graph.getBacklinks(noteB.uri).map(l => l.source)).toEqual([
            noteA.uri,
        ]);
        expect(ws.get(noteB.uri).type).toEqual('note');
        // remove note-b
        ws.delete(noteB.uri);
        const graph2 = graph_1.FoamGraph.fromWorkspace(ws);
        expect(() => ws.get(noteB.uri)).toThrow();
        expect(graph2.contains(uri_1.URI.placeholder('page-b'))).toBeTruthy();
    });
    it('Adding note should replace placeholder for wikilinks', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([
            uri_1.URI.placeholder('page-b'),
        ]);
        expect(graph.contains(uri_1.URI.placeholder('page-b'))).toBeTruthy();
        // add note-b
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
        });
        ws.set(noteB);
        graph_1.FoamGraph.fromWorkspace(ws);
        expect(() => ws.get(uri_1.URI.placeholder('page-b'))).toThrow();
        expect(ws.get(noteB.uri).type).toEqual('note');
    });
    it('Removing target note should produce placeholder for direct links', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ to: '/path/to/another/page-b.md' }],
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA).set(noteB);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteB.uri]);
        expect(graph.getBacklinks(noteB.uri).map(l => l.source)).toEqual([
            noteA.uri,
        ]);
        expect(ws.get(noteB.uri).type).toEqual('note');
        // remove note-b
        ws.delete(noteB.uri);
        const graph2 = graph_1.FoamGraph.fromWorkspace(ws);
        expect(() => ws.get(noteB.uri)).toThrow();
        expect(graph2.contains(uri_1.URI.placeholder('/path/to/another/page-b.md'))).toBeTruthy();
    });
    it('Adding note should replace placeholder for direct links', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ to: '/path/to/another/page-b.md' }],
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([
            uri_1.URI.placeholder('/path/to/another/page-b.md'),
        ]);
        expect(() => ws.get(uri_1.URI.placeholder('/path/to/another/page-b.md'))).toThrow();
        // add note-b
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
        });
        ws.set(noteB);
        graph_1.FoamGraph.fromWorkspace(ws);
        expect(() => ws.get(uri_1.URI.placeholder('page-b'))).toThrow();
        expect(ws.get(noteB.uri).type).toEqual('note');
    });
    it('removing link to placeholder should remove placeholder', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ to: '/path/to/another/page-b.md' }],
        });
        const ws = test_utils_1.createTestWorkspace().set(noteA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph.contains(uri_1.URI.placeholder('/path/to/another/page-b.md'))).toBeTruthy();
        // update the note
        const noteABis = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [],
        });
        ws.set(noteABis);
        const graph2 = graph_1.FoamGraph.fromWorkspace(ws);
        expect(graph2.contains(uri_1.URI.placeholder('/path/to/another/page-b.md'))).toBeFalsy();
    });
});
describe('Monitoring of workspace state', () => {
    it('Update links when modifying note', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
            links: [{ slug: 'page-c' }],
        });
        const noteC = test_utils_1.createTestNote({
            uri: '/path/to/more/page-c.md',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA)
            .set(noteB)
            .set(noteC);
        const graph = graph_1.FoamGraph.fromWorkspace(ws, true);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteB.uri]);
        expect(graph.getBacklinks(noteB.uri).map(l => l.source)).toEqual([
            noteA.uri,
        ]);
        expect(graph.getBacklinks(noteC.uri).map(l => l.source)).toEqual([
            noteB.uri,
        ]);
        // update the note
        const noteABis = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-c' }],
        });
        ws.set(noteABis);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteC.uri]);
        expect(graph.getBacklinks(noteB.uri).map(l => l.source)).toEqual([]);
        expect(graph
            .getBacklinks(noteC.uri)
            .map(link => link.source.path)
            .sort()).toEqual(['/path/to/another/page-b.md', '/path/to/page-a.md']);
        ws.dispose();
        graph.dispose();
    });
    it('Removing target note should produce placeholder for wikilinks', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA).set(noteB);
        const graph = graph_1.FoamGraph.fromWorkspace(ws, true);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteB.uri]);
        expect(graph.getBacklinks(noteB.uri).map(l => l.source)).toEqual([
            noteA.uri,
        ]);
        expect(ws.get(noteB.uri).type).toEqual('note');
        // remove note-b
        ws.delete(noteB.uri);
        expect(() => ws.get(noteB.uri)).toThrow();
        ws.dispose();
        graph.dispose();
    });
    it('Adding note should replace placeholder for wikilinks', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ slug: 'page-b' }],
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws, true);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([
            uri_1.URI.placeholder('page-b'),
        ]);
        // add note-b
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
        });
        ws.set(noteB);
        expect(() => ws.get(uri_1.URI.placeholder('page-b'))).toThrow();
        expect(ws.get(noteB.uri).type).toEqual('note');
        ws.dispose();
        graph.dispose();
    });
    it('Removing target note should produce placeholder for direct links', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ to: '/path/to/another/page-b.md' }],
        });
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA).set(noteB);
        const graph = graph_1.FoamGraph.fromWorkspace(ws, true);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([noteB.uri]);
        expect(graph.getBacklinks(noteB.uri).map(l => l.source)).toEqual([
            noteA.uri,
        ]);
        expect(ws.get(noteB.uri).type).toEqual('note');
        // remove note-b
        ws.delete(noteB.uri);
        expect(() => ws.get(noteB.uri)).toThrow();
        expect(graph.contains(uri_1.URI.placeholder('/path/to/another/page-b.md'))).toBeTruthy();
        ws.dispose();
        graph.dispose();
    });
    it('Adding note should replace placeholder for direct links', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ to: '/path/to/another/page-b.md' }],
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws, true);
        expect(graph.getLinks(noteA.uri).map(l => l.target)).toEqual([
            uri_1.URI.placeholder('/path/to/another/page-b.md'),
        ]);
        expect(graph.contains(uri_1.URI.placeholder('/path/to/another/page-b.md'))).toBeTruthy();
        // add note-b
        const noteB = test_utils_1.createTestNote({
            uri: '/path/to/another/page-b.md',
        });
        ws.set(noteB);
        expect(() => ws.get(uri_1.URI.placeholder('page-b'))).toThrow();
        expect(ws.get(noteB.uri).type).toEqual('note');
        ws.dispose();
        graph.dispose();
    });
    it('removing link to placeholder should remove placeholder', () => {
        const noteA = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [{ to: '/path/to/another/page-b.md' }],
        });
        const ws = test_utils_1.createTestWorkspace();
        ws.set(noteA);
        const graph = graph_1.FoamGraph.fromWorkspace(ws, true);
        expect(graph.contains(uri_1.URI.placeholder('/path/to/another/page-b.md'))).toBeTruthy();
        // update the note
        const noteABis = test_utils_1.createTestNote({
            uri: '/path/to/page-a.md',
            links: [],
        });
        ws.set(noteABis);
        expect(graph.contains(uri_1.URI.placeholder('/path/to/another/page-b.md'))).toBeFalsy();
        ws.dispose();
        graph.dispose();
    });
});
//# sourceMappingURL=workspace.test.js.map