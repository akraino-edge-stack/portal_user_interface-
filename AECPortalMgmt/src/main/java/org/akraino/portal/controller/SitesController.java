/* 
 * Copyright (c) 2018 AT&T Intellectual Property. All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *        http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.akraino.portal.controller;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;

import org.akraino.portal.data.AECPortalResponse;
import org.akraino.portal.data.BuildRequest;
import org.akraino.portal.data.EdgeSiteState;
import org.akraino.portal.data.SiteDeployRequest;
import org.akraino.portal.data.SiteStatusResponse;
import org.akraino.portal.data.WorkflowRequest;
import org.akraino.portal.entity.EdgeSite;
import org.akraino.portal.entity.EdgeSiteYamlTemplate;
import org.akraino.portal.service.EdgeSiteService;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequestMapping("/edgeSites")
public class SitesController {

	@Autowired
	EdgeSiteService edgeSiteService;

	private static final Logger logger = Logger.getLogger(SitesController.class);

	@RequestMapping(value = "/{regionId}", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<List<EdgeSite>> getAllEdgeSites(@PathVariable("regionId") Integer regionId) {

		List<EdgeSite> list = new ArrayList<EdgeSite>();

		try {

			list = edgeSiteService.getSites(regionId);

		} catch (Exception e) {
			logger.error(e);
		}

		return new ResponseEntity<List<EdgeSite>>(list, HttpStatus.OK);
	}

	@RequestMapping(value = "/upload", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<SiteStatusResponse> uploadInputFile(@RequestParam MultipartFile file,
			@ModelAttribute("siteName") String siteName, @ModelAttribute("blueprint") String blueprint,
			@ModelAttribute("edgeSiteIP") String edgeSiteIP, @ModelAttribute("edgeSiteUser") String edgeSiteUser,
			@ModelAttribute("edgeSitePwd") String edgeSitePwd) {

		SiteStatusResponse response = new SiteStatusResponse();

		EdgeSiteState siteRequest = new EdgeSiteState();

		siteRequest.setSiteName(siteName);
		siteRequest.setBlueprint(blueprint);
		siteRequest.setEdgeSiteIP(edgeSiteIP);
		siteRequest.setEdgeSiteUser(edgeSiteUser);
		siteRequest.setEdgeSitePwd(edgeSitePwd);

		try {
			boolean copyStatus = edgeSiteService.saveAndCopyInput(file.getBytes(), siteRequest);
			if (copyStatus) {
				response.setStatusCode("200");
				response.setMessage("Input file copied successfully");
			} else {
				response.setStatusCode("406");
				response.setMessage("Input file copy failed");
			}

		} catch (Exception e) {
			response.setStatusCode("406");
			response.setMessage(e.getMessage());
			StringWriter sw = new StringWriter();
			e.printStackTrace(new PrintWriter(sw));
			String exceptionAsString = sw.toString();
			logger.error(exceptionAsString);
		}

		return new ResponseEntity<SiteStatusResponse>(response, HttpStatus.OK);

	}

	@RequestMapping(value = "/status", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<SiteStatusResponse> updateSiteStatus(@RequestBody EdgeSiteState statusRequest) {

		SiteStatusResponse response = new SiteStatusResponse();
		response.setSiteName(statusRequest.getSiteName());

		try {

			edgeSiteService.updateSiteStatus(statusRequest);

		} catch (Exception e) {
			response.setStatusCode("406");
			response.setMessage("install status update failed");
		}

		return new ResponseEntity<SiteStatusResponse>(response, HttpStatus.OK);
	}
	
	@RequestMapping(value = "/build", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<SiteStatusResponse> buildEdgeSite(@RequestBody BuildRequest buildRequest) {

		SiteStatusResponse response = new SiteStatusResponse();
		response.setSiteName(buildRequest.getSitename());

		try {

			edgeSiteService.buildEdgeSite(buildRequest);

		} catch (Exception e) {
			response.setStatusCode("406");
			response.setMessage("build status call initiation failed");
		}

		return new ResponseEntity<SiteStatusResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/files/build/{siteName}", method = RequestMethod.GET, produces = MediaType.TEXT_PLAIN_VALUE)
	public ResponseEntity<String> getBuildYamlFile(@PathVariable("siteName") String siteName) {

		String generatedYamlFileContent = null;
		try {
			generatedYamlFileContent = edgeSiteService.getBuildYamlContent(siteName);
		} catch (Exception e) {
			logger.error("error reading yaml file:" + e);
		}

		return new ResponseEntity<String>(generatedYamlFileContent, HttpStatus.OK);
	}
	
	@RequestMapping(value = "/files/yamlTemplate", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<List<EdgeSiteYamlTemplate>> getYamlTemplateFiles() {

		List<EdgeSiteYamlTemplate> yamlTemplateList = null;
		try {
			yamlTemplateList = edgeSiteService.getYamlTemplates();
		} catch (Exception e) {
			logger.error("error reading yaml template files:" + e);
		}

		return new ResponseEntity<List<EdgeSiteYamlTemplate>>(yamlTemplateList, HttpStatus.OK);
	}

	@RequestMapping(value = "/files/heat/{vnfName}", method = RequestMethod.GET, produces = MediaType.TEXT_PLAIN_VALUE)
	public ResponseEntity<String> getHeatTemplateFile(@PathVariable("vnfName") String vnfName) {

		logger.error("get heat template file for VNF");

		String heatFileContent = null;
		try {
			heatFileContent = edgeSiteService.getHeatContent(vnfName);
		} catch (Exception e) {
			logger.error("error - get heat template file for VNF:" + e);
		}

		return new ResponseEntity<String>(heatFileContent, HttpStatus.OK);
	}
	
	@RequestMapping(value = "/onboardVNF", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<AECPortalResponse> onBoardVNF(@RequestBody WorkflowRequest vnfRequest) {

		AECPortalResponse response = new AECPortalResponse();

		try {

			edgeSiteService.onBoardVNF(vnfRequest);

			response.setEntity("VNF Onboard");
			response.setStatusCode("200");
			response.setMessage("VNF Onboard call initiated successfuly");

		} catch (Exception e) {

			response.setEntity("VNF Onboard");
			response.setStatusCode("406");
			response.setMessage("VNF Onboard call initiation failed");

		}

		return new ResponseEntity<AECPortalResponse>(response, HttpStatus.OK);

	}
	
	@RequestMapping(value = "/deploy", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<AECPortalResponse> deploySite(@RequestBody SiteDeployRequest siteDeployRequest) {

		AECPortalResponse response = new AECPortalResponse();

		try {

			edgeSiteService.deploySite(siteDeployRequest);

			response.setEntity("Site Deploy");
			response.setStatusCode("200");
			response.setMessage("Site Deploy call initiated successfuly");

		} catch (Exception e) {

			response.setEntity("Site Deploy");
			response.setStatusCode("406");
			response.setMessage("Site Deploy call initiation failed");

		}

		return new ResponseEntity<AECPortalResponse>(response, HttpStatus.OK);

	}

}